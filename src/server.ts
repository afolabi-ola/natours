import { connect } from 'mongoose';
import { PORT } from './config/env';
import app from './app';

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);

  console.log(`Uncaught exception. Shutting down...`);

  process.exit(1);
});

const DB =
  process.env.NODE_ENV === 'production'
    ? process.env.DATABASE?.replace(
        '<PASSWORD>',
        process.env.DATABASE_PASSWORD ?? '',
      )
    : process.env.DATABASE_LOCAL;

if (DB) {
  connect(DB)
    .then(() =>
      console.log(
        //eslint-disable-next-line no-nested-ternary
        process.env.NODE_ENV === 'production'
          ? 'DB connection successful!'
          : process.env.NODE_ENV === 'development'
            ? 'Local DB connection successful!'
            : 'Unknown DB connected',
      ),
    )
    .catch((err) => console.log('DB Error:', err));
}

const port = PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App listening on port ${port}...`);
});

process.on('unhandledRejection', (err: unknown) => {
  if (err instanceof Error) {
    console.log(err.name, err.message);
  } else {
    console.log('Unknown rejection:', err);
  }
  console.log('Unhandled rejection. Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
    // No need for process.exit(0) here as the server.close callback
    // will naturally let the event loop empty and exit.
  });
});
