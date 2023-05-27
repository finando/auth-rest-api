const crypto = require('crypto');

crypto.randomBytes(48, (_, buffer) =>
  console.log(
    JSON.stringify(
      [
        ...((process.env.KEYS && JSON.parse(process.env.KEYS)) || []),
        buffer.toString('hex'),
      ],
      null,
      2
    )
  )
);
