export const errorHandler = ({
  error,
  functionName,
  message,
  req,
  res,
}: {
  error: any;
  functionName: string;
  message: string;
  req?: any;
  res?: any;
}) => {
  try {
    const reqQueryParams = req?.query;
    if (reqQueryParams?.interactiveNonce) delete reqQueryParams.interactiveNonce;

    console.error(
      JSON.stringify({
        errorContext: {
          message,
          functionName,
        },
        requestContext: {
          requestId: req?.id,
          reqQueryParams,
          reqBody: req?.body,
        },
        error: JSON.stringify(error),
      }),
    );

    return res.status(error.status || 500).send({ error, message, success: false });
  } catch (e) {
    console.error("❌ Error printing the logs", e);
    return res.status(500).send({ error: e, message, success: false });
  }
};
