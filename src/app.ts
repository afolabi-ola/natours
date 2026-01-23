import express, { type Request } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { join } from 'path';
import { parse } from 'qs';
import tourRouter from './routes/tourRoutes';
import userRouter from './routes/userRoutes';
import reviewRouter from './routes/reviewRoutes';
import bookingRouter from './routes/bookingRoutes';
import viewsRouter from './routes/viewsRoutes';
import { NODE_ENV } from './config/env';
import AppError from './utils/appError';
import globalErrorHandler from './controllers/errorController';

const app = express();

app.set('view engine', 'pug');
app.set('views', join(__dirname, '../src/views'));

app.use(cors());

app.options('/(.*)', cors());

app.use(express.static(join(__dirname, `../public`)));

//Securing https
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: [
        "'self'",
        'https://*.stripe.com',
        'https://cdnjs.cloudflare.com',
      ],
      frameSrc: ["'self'", 'https://*.stripe.com'],
      objectSrc: ["'none'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      workerSrc: ["'self'", 'data:', 'blob:'],
      childSrc: ["'self'", 'blob:'],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://*.tile.openstreetmap.org',
        'https://*.fastly.net', // 👈 Allows your CartoDB tiles
        'https://*.cloudflare.com',
      ],
      connectSrc: [
        "'self'",
        'blob:',
        'https://*.tile.openstreetmap.org',
        'https://*.fastly.net', // 👈 Allows the map connection
        'ws://127.0.0.1:*/', // 👈 Allows Parcel's HMR WebSocket
      ],
      upgradeInsecureRequests: [],
    },
  }),
);

app.use(compression());

//Development logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  limit: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request please try again in an hour!',
});

//Rate limiting
app.use('/api', limiter);

//reading data from query string and parsing it as query obj into req.query
app.set('query parser', (str: string) => parse(str));

//Reading data from body to req.body
app.use(express.json({ limit: '10kb' }));

//Reading data from cookies
app.use(cookieParser());

app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//Data sanitization against no sql query injection
// app.use(mongoSanitize());

// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👋');
//   next();
// });

//Test middleware
app.use((req, res, next) => {
  (req as Request & { requestTime: string }).requestTime =
    new Date().toISOString();
  next();
});

//Rendering
app.use('/', viewsRouter);

//Mounting routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/reviews', reviewRouter);

//Not found routes
app.all('/{*splat}', (req, res, next) => {
  // const err = new Error(
  //   `Can't find ${req.originalUrl} on this server!`,
  // ) as ErrorType;
  // err.statusCode = 404;
  // err.status = 'fail';

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//Error handling miiddleware
app.use(globalErrorHandler);

export default app;
