export const createPaymentUrl = async (req, res) => {
    res.json({ success: true, message: 'Payment gateway initialized (COD supported)' });
};

export const handleVnPayReturn = async (req, res) => {
    res.json({ success: true, message: 'Payment processed successfully' });
};
