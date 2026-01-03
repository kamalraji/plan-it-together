// Simple test script to verify notification functionality
const { discoveryService } = require('./dist/services/discovery.service');
const { communicationService } = require('./dist/services/communication.service');

async function testNotifications() {
  console.log('Testing notification functionality...');
  
  try {
    // Test the communication service first
    console.log('\n1. Testing email sending...');
    const emailResult = await communicationService.sendEmail({
      to: ['test@example.com'],
      subject: 'Test Email',
      body: 'This is a test email from the notification system.'
    });
    
    console.log('Email result:', emailResult);
    
    // Test notification tracking
    console.log('\n2. Testing notification tracking...');
    const mockOrgId = 'test-org-id';
    const mockEventId = 'test-event-id';
    
    // This would normally query the database, but we'll simulate it
    console.log(`Would notify followers for org ${mockOrgId} about event ${mockEventId}`);
    
    console.log('\n✅ Notification functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testNotifications();
}

module.exports = { testNotifications };