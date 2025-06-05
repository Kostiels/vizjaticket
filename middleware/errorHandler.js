module.exports = (err, req, res, next) => {
    const isApi = req.originalUrl.startsWith('/api')
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode
    if (isApi) {
      res.status(statusCode).json({
        success: false,
        error: err.message || 'Wewnętrzny błąd serwera'
      })
    } else {
      res.status(statusCode).render('error', {
        title: 'Błąd',
        error: {
          status: statusCode,
          message: err.message || 'Coś poszło nie tak'
        }
      })
    }
  }
  