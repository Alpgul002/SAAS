require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const axios = require('axios');

const { cloneTemplateWorkflow, deleteWorkflow } = require('./n8nClient');
const { authenticateToken, authenticateApiKey } = require('./middleware/auth');
const { validateRegistration, validateLogin, validateChatMessage } = require('./middleware/validation');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10 // limit each IP to 10 chat requests per minute
});

// Body parsing middleware
app.use('/webhook/stripe', bodyParser.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// =============================================================================
// AUTH ROUTES
// =============================================================================

app.post('/auth/register', validateRegistration, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM tenants WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO tenants (email, password_hash) VALUES ($1, $2) RETURNING id, email, api_key, plan',
      [email, passwordHash]
    );
    
    const user = result.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        apiKey: user.api_key
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, plan, api_key, is_active FROM tenants WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account deactivated' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        apiKey: user.api_key
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// =============================================================================
// STRIPE INTEGRATION
// =============================================================================

app.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Update user's plan and create workflow
        const updateResult = await pool.query(
          'UPDATE tenants SET plan = $1, stripe_customer = $2 WHERE email = $3 RETURNING id',
          [session.metadata.plan, session.customer, session.customer_email]
        );
        
        if (updateResult.rows.length > 0) {
          const tenantId = updateResult.rows[0].id;
          
          try {
            const workflowId = await cloneTemplateWorkflow(tenantId);
            await pool.query(
              'UPDATE tenants SET n8n_workflow = $1 WHERE id = $2',
              [workflowId, tenantId]
            );
            console.log(`Workflow created for tenant ${tenantId}: ${workflowId}`);
          } catch (workflowError) {
            console.error('Failed to create workflow:', workflowError);
            // Continue anyway - user can retry later
          }
        }
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        const subscription = event.data.object;
        await pool.query(
          'UPDATE tenants SET plan = $1, is_active = $2 WHERE stripe_customer = $3',
          ['basic', false, subscription.customer]
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.post('/create-checkout', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!['basic', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: process.env[`STRIPE_PRICE_${plan.toUpperCase()}`],
        quantity: 1,
      }],
      metadata: {
        plan: plan,
        tenant_id: req.tenant.id
      },
      customer_email: req.tenant.email,
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?cancelled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// =============================================================================
// TENANT MANAGEMENT
// =============================================================================

app.get('/tenant/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, plan, api_key, settings, created_at FROM tenants WHERE id = $1',
      [req.tenant.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.patch('/tenant/settings', authenticateToken, async (req, res) => {
  try {
    const { settings } = req.body;
    
    await pool.query(
      'UPDATE tenants SET settings = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(settings), req.tenant.id]
    );
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.post('/tenant/regenerate-api-key', authenticateToken, async (req, res) => {
  try {
    const newApiKey = uuidv4();
    
    await pool.query(
      'UPDATE tenants SET api_key = $1, updated_at = NOW() WHERE id = $2',
      [newApiKey, req.tenant.id]
    );
    
    res.json({ apiKey: newApiKey });
  } catch (error) {
    console.error('API key regeneration error:', error);
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

// =============================================================================
// CHAT FUNCTIONALITY
// =============================================================================

// Demo chatbot endpoint - herkese açık, limitli kullanım
const demoChatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 5, // IP başına 5 mesaj/saat
  message: { error: 'Demo limiti aşıldı. Lütfen daha sonra tekrar deneyin.' }
});

app.post('/webhook/demo-chat', demoChatLimiter, validateChatMessage, async (req, res) => {
  try {
    const { message } = req.body;

    // n8n Cloud webhook URL'ini kullan
    const n8nCloudUrl = process.env.N8N_CLOUD_WEBHOOK_URL;
    
    if (!n8nCloudUrl) {
      console.error('N8N_CLOUD_WEBHOOK_URL environment variable is not set');
      return res.status(500).json({ error: 'Demo chatbot yapılandırması eksik.' });
    }
    
    const n8nResponse = await axios.post(
      n8nCloudUrl,
      { message },
      { 
        headers: { 'Content-Type': 'application/json' }, 
        timeout: 30000 
      }
    );

    const reply = n8nResponse.data.reply || 'Sorry, I could not process your request.';
    res.json({ reply });
  } catch (error) {
    console.error('Demo chat error:', error.message);
    res.status(500).json({ error: 'Demo chatbot şu anda kullanılamıyor.' });
  }
});

app.post('/webhook/chat/:tenantId', chatLimiter, validateChatMessage, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { message } = req.body;
    const apiKey = req.headers['x-api-key'];
    
    // Verify API key and get tenant
    const tenantResult = await pool.query(
      'SELECT * FROM tenants WHERE id = $1 AND api_key = $2 AND is_active = true',
      [tenantId, apiKey]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key or tenant' });
    }
    
    const tenant = tenantResult.rows[0];
    
    // Log the chat message
    await pool.query(
      'INSERT INTO chat_logs (tenant_id, message, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [tenantId, message, req.ip, req.get('User-Agent')]
    );
    
    try {
      // Call n8n webhook
      const n8nResponse = await axios.post(
        `${process.env.N8N_URL}/webhook/chat/${tenantId}`,
        { 
          message,
          tenant_id: tenantId,
          settings: tenant.settings
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          },
          timeout: 30000
        }
      );
      
      const reply = n8nResponse.data.reply || 'Sorry, I could not process your request.';
      
      // Update chat log with response
      await pool.query(
        'UPDATE chat_logs SET response = $1 WHERE tenant_id = $2 AND message = $3 AND response IS NULL ORDER BY created_at DESC LIMIT 1',
        [reply, tenantId, message]
      );
      
      res.json({ reply });
    } catch (n8nError) {
      console.error('n8n webhook error:', n8nError.message);
      
      // Fallback response
      const fallbackReply = 'I apologize, but I am temporarily unavailable. Please try again later.';
      
      await pool.query(
        'UPDATE chat_logs SET response = $1 WHERE tenant_id = $2 AND message = $3 AND response IS NULL ORDER BY created_at DESC LIMIT 1',
        [fallbackReply, tenantId, message]
      );
      
      res.json({ reply: fallbackReply });
    }
  } catch (error) {
    console.error('Chat webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/tenant/chat-logs', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      'SELECT message, response, created_at FROM chat_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.tenant.id, limit, offset]
    );
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM chat_logs WHERE tenant_id = $1',
      [req.tenant.id]
    );
    
    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Chat logs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch chat logs' });
  }
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
}); 