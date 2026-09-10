export const getDeliveredEmailTemplate = ({ customerName, orderId, restaurantName }) => `
    <div style="background-color:#f9fafb; padding:24px; font-family:Arial,sans-serif;">
        <div style="max-width:600px; margin:0 auto; background:#fff; padding:32px; border-radius:24px; border:1px solid #f3f4f6;">
            <div style="display:inline-block; padding:8px 16px; background:#f97316; color:#fff; border-radius:999px; font-size:12px; font-weight:bold;">ORDERLY DELIVERED</div>
            <h1 style="color:#111827; margin-top:20px;">Order Delivered Successfully</h1>
            <p>Hello <strong>${customerName}</strong>, order #${orderId} from <strong>${restaurantName}</strong> has been delivered.</p>
            <div style="padding:20px; background:#fff7ed; border-radius:16px; margin:20px 0;">
                <p style="margin:0; color:#9a3412;">Thank you for ordering with Orderly!</p>
            </div>
            <a href="http://localhost:5173/customer/tracking" style="display:inline-block; background:#f97316; color:#fff; padding:12px 24px; text-decoration:none; border-radius:12px; font-weight:bold;">Track Order</a>
        </div>
    </div>
`;

export const getRefundEmailTemplate = ({ customerName, orderId, refundAmount, gatewayName, status }) => {
    const isSuccess = status === 'success';
    return `
        <div style="background-color:#f9fafb; padding:24px; font-family:Arial,sans-serif;">
            <div style="max-width:600px; margin:0 auto; background:#fff; padding:32px; border-radius:24px; border:1px solid #f3f4f6;">
                <div style="display:inline-block; padding:8px 16px; background:${isSuccess ? '#2563eb' : '#f59e0b'}; color:#fff; border-radius:999px; font-size:12px; font-weight:bold;">ORDERLY REFUND</div>
                <h1 style="color:#111827; margin-top:20px;">${isSuccess ? 'Refund Successful' : 'Refund Update'}</h1>
                <p>Hello <strong>${customerName}</strong>, refund request for order #${orderId} has been processed.</p>
                <p>Amount: <strong>$${refundAmount}</strong> via ${gatewayName}</p>
                <a href="http://localhost:5173/customer/tracking" style="display:inline-block; background:#2563eb; color:#fff; padding:12px 24px; text-decoration:none; border-radius:12px; font-weight:bold;">Check Status</a>
            </div>
        </div>
    `;
};

export const getApprovalStatusTemplate = ({ fullName, accountType, status, reason }) => {
    const isApproved = status.toUpperCase() === 'APPROVED';
    const roleLabel = accountType === 'restaurant' ? 'Restaurant' : 'Delivery Driver';
    return `
        <div style="background-color:#f9fafb; padding:24px; font-family:Arial,sans-serif;">
            <div style="max-width:600px; margin:0 auto; background:#fff; padding:32px; border-radius:24px; border:1px solid #f3f4f6;">
                <h1 style="color:#111827;">${isApproved ? 'Account Approved' : 'Approval Update'}</h1>
                <p>Hello <strong>${fullName}</strong>, your ${roleLabel} account status update:</p>
                <div style="padding:16px; background:${isApproved ? '#f0fdf4' : '#fef2f2'}; border-radius:12px; color:${isApproved ? '#166534' : '#991b1b'}; font-weight:bold; font-size:18px;">
                    ${status.toUpperCase()}
                </div>
                ${!isApproved && reason ? `<p style="margin-top:10px; color:#991b1b;">Reason: ${reason}</p>` : ''}
            </div>
        </div>
    `;
};
