const axios = require('axios');

const { N8N_URL, N8N_API_KEY, N8N_TEMPLATE_WORKFLOW_ID } = process.env;

const client = axios.create({
  baseURL: `${N8N_URL}/rest`,
  headers: {
    'Authorization': `Bearer ${N8N_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

async function cloneTemplateWorkflow(tenantId) {
  try {
    // Get template workflow
    const response = await client.get(`/workflows/${N8N_TEMPLATE_WORKFLOW_ID}`);
    const template = response.data;
    
    // Prepare new workflow
    delete template.id;
    template.name = `Chatbot-${tenantId}`;
    template.active = true;
    
    // Update webhook paths in nodes
    template.nodes = template.nodes.map(node => {
      if (node.type === 'n8n-nodes-base.webhook') {
        node.parameters = {
          ...node.parameters,
          path: `chat/${tenantId}`,
          httpMethod: 'POST',
          responseMode: 'onReceived'
        };
      }
      return node;
    });
    
    // Create new workflow
    const createResponse = await client.post('/workflows', template);
    
    // Activate workflow
    if (createResponse.data.id) {
      await client.post(`/workflows/${createResponse.data.id}/activate`);
    }
    
    return createResponse.data.id;
  } catch (error) {
    console.error('Error cloning workflow:', error.response?.data || error.message);
    throw new Error('Failed to create chatbot workflow');
  }
}

async function updateWorkflowSettings(workflowId, settings) {
  try {
    const response = await client.get(`/workflows/${workflowId}`);
    const workflow = response.data;
    
    // Update webhook settings
    workflow.nodes = workflow.nodes.map(node => {
      if (node.type === 'n8n-nodes-base.webhook') {
        node.parameters = {
          ...node.parameters,
          ...settings
        };
      }
      return node;
    });
    
    await client.put(`/workflows/${workflowId}`, workflow);
    return true;
  } catch (error) {
    console.error('Error updating workflow:', error.response?.data || error.message);
    throw new Error('Failed to update workflow settings');
  }
}

async function deleteWorkflow(workflowId) {
  try {
    await client.delete(`/workflows/${workflowId}`);
    return true;
  } catch (error) {
    console.error('Error deleting workflow:', error.response?.data || error.message);
    return false;
  }
}

module.exports = { 
  cloneTemplateWorkflow, 
  updateWorkflowSettings, 
  deleteWorkflow 
}; 