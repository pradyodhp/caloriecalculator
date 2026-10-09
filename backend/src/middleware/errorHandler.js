// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  const status = err.name === 'ProviderError' ? 503 : 500;
  res.status(status).json({
    error: status === 503 ? 'Food data provider unavailable' : 'Internal Server Error',
  });
};
