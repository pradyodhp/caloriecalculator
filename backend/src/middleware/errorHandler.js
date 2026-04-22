const errorHandler = (err, req, res, next) => {
    console.error('💥 Unhandled Error:', err.stack);
    res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
};

module.exports = errorHandler;
