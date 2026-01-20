import { Document, model, Query, Schema, UpdateQuery } from 'mongoose';
import { isEmail } from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import AppError from '../utils/appError';

export interface UserModelType extends Document {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string | undefined;
  photo: string;
  passwordChangedAt: Date;
  role: 'admin' | 'lead-guide' | 'guide' | 'user';
  active: boolean;
  passwordResetToken: string | undefined;
  passwordResetExpires: Date | undefined;
}

export interface UserDocType extends UserModelType {
  isPassWordCorrect: (
    dbPassword: string,
    requestPassword: string,
  ) => Promise<boolean>;

  changedPasswordAt: (JWTTimestamp: number) => boolean;
  createPasswordResetToken: () => string;
}

const userSchema = new Schema<UserDocType>({
  name: {
    type: String,
    required: [true, 'Please provide your namee'],
  },

  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Please provide a valid email'],
  },

  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password and Confirm Password do not match.',
    },
  },

  photo: {
    type: String,
    default: 'default.jpg',
  },

  passwordChangedAt: {
    type: Date,
    select: false,
  },

  role: {
    type: String,
    enum: ['admin', 'lead-guide', 'guide', 'user'],
    default: 'user',
  },

  active: {
    type: Boolean,
    default: true,
    select: false,
  },

  passwordResetToken: String,

  passwordResetExpires: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 14);

  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = new Date(Date.now() - 1000);

  next();
});

userSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  // If it's an aggregation pipeline, block it outright
  if (Array.isArray(update)) {
    return next(
      new AppError('Password updates are not allowed via this route', 400),
    );
  }

  const updateObj = update as UpdateQuery<UserDocType>;

  if (
    updateObj.password ||
    updateObj.passwordConfirm ||
    updateObj.$set?.password ||
    updateObj.$set?.passwordConfirm
  ) {
    return next(
      new AppError('Password updates are not allowed via this route', 400),
    );
  }

  next();
});

userSchema.methods.isPassWordCorrect = async (
  requestPassword: string,
  dbPassword: string,
): Promise<boolean> => await bcrypt.compare(requestPassword, dbPassword);

userSchema.methods.changedPasswordAt = function (
  JWTTimestamp: number,
): boolean {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      (this.passwordChangedAt.getTime() / 1000).toString(),
      10,
    );

    return JWTTimestamp < changedTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.pre<Query<UserModelType[], UserModelType>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  next();
});

const User = model<UserDocType>('User', userSchema);

export default User;
