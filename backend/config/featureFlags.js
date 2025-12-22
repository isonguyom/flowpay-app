// Example: define which users get the new payment flow
export const featureFlags = {
    newPaymentFlow: [
        'userId1',
        'userId2',
        // Add more user IDs here for gradual rollout
    ]
};

// Helper function
export const isNewPaymentFlowEnabled = (userId) => {
    return featureFlags.newPaymentFlow.includes(userId.toString());
};


