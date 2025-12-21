// Transaction statuses
export const TRX_STATUS = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
};

// Transaction types
export const TRX_TYPE = {
    PAYMENT: 'PAYMENT',
    FUND: 'FUND',
    WITHDRAW: 'WITHDRAW',
};

// Helper arrays for Mongoose enums
export const TRX_STATUS_VALUES = Object.values(TRX_STATUS);
export const TRX_TYPE_VALUES = Object.values(TRX_TYPE);
