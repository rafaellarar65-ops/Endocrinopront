export interface TrpcContext {
  user?: {
    id: number;
    openId: string;
    email?: string;
    name?: string;
    loginMethod?: string;
    role?: 'user' | 'admin';
    createdAt?: Date;
    updatedAt?: Date;
    lastSignedIn?: Date;
  };
  req: any;
  res: any;
}
