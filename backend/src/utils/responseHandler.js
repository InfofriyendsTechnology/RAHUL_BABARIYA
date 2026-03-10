const responseHandler = {
  success: (res, message, data = null, statusCode = 200) =>
    res.status(statusCode).json({ success: true, message, data }),

  created: (res, message, data) =>
    res.status(201).json({ success: true, message, data }),

  error: (res, message, statusCode = 400) =>
    res.status(statusCode).json({ success: false, message: message || 'Something went wrong' }),

  unauthorized: (res, message = 'Unauthorized') =>
    res.status(401).json({ success: false, message }),

  notFound: (res, message = 'Not found') =>
    res.status(404).json({ success: false, message }),

  serverError: (res, error) =>
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
    }),
};

export default responseHandler;
