const actualAPI = require('@actual-app/api');
const fs = require('fs');

async function testWithBudgetSyncId(budgetSyncId) {
  console.log(`🔍 Testing with budget sync ID: ${budgetSyncId}\n`);
  
  try {
    // Ensure data directory exists
    const dataDir = './test-data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log('1. Initializing API...');
    await actualAPI.init({
      dataDir: dataDir,
      serverURL: 'http://localhost:5006',
      password: 'REY!bcv4btn3ztc3yer',
    });
    
    console.log('2. Getting budgets...');
    const budgets = await actualAPI.getBudgets();
    console.log(`Found ${budgets.length} budgets:`);
    budgets.forEach((budget, index) => {
      console.log(`  ${index + 1}. ${budget.name || 'Unnamed'} (ID: ${budget.id})`);
    });
    
    console.log('3. Downloading budget...');
    await actualAPI.downloadBudget(budgetSyncId);
    console.log('✅ Budget downloaded successfully!');
    
    console.log('4. Getting accounts...');
    const accounts = await actualAPI.getAccounts();
    console.log(`Found ${accounts.length} accounts:`);
    accounts.forEach((account, index) => {
      console.log(`  ${index + 1}. ${account.name} (${account.type}) - $${account.balance}`);
    });
    
    await actualAPI.shutdown();
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Get budget sync ID from command line argument
const budgetSyncId = process.argv[2];
if (!budgetSyncId) {
  console.log('Usage: node test-budget.js <budget-sync-id>');
  console.log('Example: node test-budget.js your-budget-sync-id-here');
  process.exit(1);
}

testWithBudgetSyncId(budgetSyncId);
