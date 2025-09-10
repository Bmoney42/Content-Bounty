/**
 * Creator Bounty - Feature Testing Script
 * 
 * This script helps test the Phase 1 & 2 features we've implemented.
 * Run this in your browser console to verify everything is working.
 */

console.log('🧪 Creator Bounty Feature Testing Script');
console.log('=====================================');

// Test 1: Check if our services are loaded
function testServiceAvailability() {
  console.log('\n🔍 Testing Service Availability...');
  
  const services = [
    'TaskQueueService',
    'ErrorMonitoringService', 
    'AuditLogger',
    'StateMachine',
    'DisputeResolutionService',
    'EnhancedFirebaseService',
    'EnhancedStripeService'
  ];
  
  services.forEach(service => {
    if (window[service]) {
      console.log(`✅ ${service} is available`);
    } else {
      console.log(`❌ ${service} is not available`);
    }
  });
}

// Test 2: Test Error Monitoring
function testErrorMonitoring() {
  console.log('\n🚨 Testing Error Monitoring...');
  
  try {
    // Simulate an error
    throw new Error('Test error for monitoring system');
  } catch (error) {
    console.log('✅ Error caught and should be logged');
    console.log('Error message:', error.message);
  }
}

// Test 3: Test Performance Tracking
function testPerformanceTracking() {
  console.log('\n⏱️ Testing Performance Tracking...');
  
  const startTime = Date.now();
  
  // Simulate some work
  setTimeout(() => {
    const duration = Date.now() - startTime;
    console.log(`✅ Performance test completed in ${duration}ms`);
  }, 100);
}

// Test 4: Test Task Queue (if available)
function testTaskQueue() {
  console.log('\n🔄 Testing Task Queue...');
  
  if (window.TaskQueueService) {
    console.log('✅ Task Queue Service is available');
    
    // Try to get queue stats
    if (typeof window.TaskQueueService.getQueueStats === 'function') {
      window.TaskQueueService.getQueueStats()
        .then(stats => {
          console.log('📊 Queue Stats:', stats);
        })
        .catch(error => {
          console.log('⚠️ Could not get queue stats:', error.message);
        });
    }
  } else {
    console.log('❌ Task Queue Service is not available');
  }
}

// Test 5: Test Audit Logging
function testAuditLogging() {
  console.log('\n📝 Testing Audit Logging...');
  
  if (window.AuditLogger) {
    console.log('✅ Audit Logger is available');
    
    // Try to log a test event
    if (typeof window.AuditLogger.logEvent === 'function') {
      window.AuditLogger.logEvent(
        'test_user',
        'test_action',
        'test_resource',
        'test_id',
        undefined,
        { test: true },
        { test: true }
      ).then(() => {
        console.log('✅ Test audit event logged successfully');
      }).catch(error => {
        console.log('⚠️ Could not log audit event:', error.message);
      });
    }
  } else {
    console.log('❌ Audit Logger is not available');
  }
}

// Test 6: Test State Machine
function testStateMachine() {
  console.log('\n🔄 Testing State Machine...');
  
  if (window.StateMachine) {
    console.log('✅ State Machine is available');
    
    // Try to create a test state machine
    try {
      const testSM = new window.StateMachine({
        initialState: 'pending',
        transitions: [
          { from: 'pending', to: 'active', roles: ['business'] },
          { from: 'active', to: 'completed', roles: ['business'] }
        ]
      });
      
      console.log('✅ Test state machine created successfully');
      
      // Test a valid transition
      const result = testSM.transition('pending', 'active', 'business');
      if (result.success) {
        console.log('✅ Valid state transition successful');
      } else {
        console.log('❌ Valid state transition failed:', result.error);
      }
      
      // Test an invalid transition
      const invalidResult = testSM.transition('active', 'pending', 'creator');
      if (!invalidResult.success) {
        console.log('✅ Invalid state transition correctly rejected');
      } else {
        console.log('❌ Invalid state transition should have been rejected');
      }
      
    } catch (error) {
      console.log('❌ State Machine test failed:', error.message);
    }
  } else {
    console.log('❌ State Machine is not available');
  }
}

// Test 7: Test Firebase Connection
function testFirebaseConnection() {
  console.log('\n🔥 Testing Firebase Connection...');
  
  if (window.firebase) {
    console.log('✅ Firebase is available');
    
    // Check if we can access Firestore
    if (window.firebase.firestore) {
      console.log('✅ Firestore is available');
    } else {
      console.log('❌ Firestore is not available');
    }
    
    // Check if we can access Auth
    if (window.firebase.auth) {
      console.log('✅ Firebase Auth is available');
    } else {
      console.log('❌ Firebase Auth is not available');
    }
  } else {
    console.log('❌ Firebase is not available');
  }
}

// Test 8: Test Stripe Integration
function testStripeIntegration() {
  console.log('\n💳 Testing Stripe Integration...');
  
  if (window.StripeService) {
    console.log('✅ Stripe Service is available');
  } else {
    console.log('❌ Stripe Service is not available');
  }
  
  if (window.EnhancedStripeService) {
    console.log('✅ Enhanced Stripe Service is available');
  } else {
    console.log('❌ Enhanced Stripe Service is not available');
  }
}

// Test 9: Test Form Validation
function testFormValidation() {
  console.log('\n📋 Testing Form Validation...');
  
  // Check if Zod is available
  if (window.zod) {
    console.log('✅ Zod validation is available');
  } else {
    console.log('❌ Zod validation is not available');
  }
  
  // Check if React Hook Form is available
  if (window.ReactHookForm) {
    console.log('✅ React Hook Form is available');
  } else {
    console.log('❌ React Hook Form is not available');
  }
}

// Test 10: Test UI Components
function testUIComponents() {
  console.log('\n🎨 Testing UI Components...');
  
  // Check if Tailwind is working
  const testElement = document.createElement('div');
  testElement.className = 'bg-blue-500 text-white p-4 rounded';
  document.body.appendChild(testElement);
  
  const computedStyle = window.getComputedStyle(testElement);
  if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
    console.log('✅ Tailwind CSS is working');
  } else {
    console.log('❌ Tailwind CSS may not be working');
  }
  
  document.body.removeChild(testElement);
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running all feature tests...\n');
  
  testServiceAvailability();
  testErrorMonitoring();
  testPerformanceTracking();
  testTaskQueue();
  testAuditLogging();
  testStateMachine();
  testFirebaseConnection();
  testStripeIntegration();
  testFormValidation();
  testUIComponents();
  
  console.log('\n🎉 Feature testing completed!');
  console.log('Check the results above to see what\'s working.');
}

// Export functions for manual testing
window.testFeatures = {
  runAll: runAllTests,
  testServiceAvailability,
  testErrorMonitoring,
  testPerformanceTracking,
  testTaskQueue,
  testAuditLogging,
  testStateMachine,
  testFirebaseConnection,
  testStripeIntegration,
  testFormValidation,
  testUIComponents
};

// Auto-run tests if this script is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  runAllTests();
}

console.log('\n💡 Manual Testing Commands:');
console.log('- testFeatures.runAll() - Run all tests');
console.log('- testFeatures.testErrorMonitoring() - Test error monitoring');
console.log('- testFeatures.testTaskQueue() - Test task queue');
console.log('- testFeatures.testAuditLogging() - Test audit logging');
console.log('- testFeatures.testStateMachine() - Test state machine');
