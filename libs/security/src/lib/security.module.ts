import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@mtw/config';
import { AesGcmCryptoService, PasswordService } from './security';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AesGcmCryptoService, PasswordService],
  exports: [AesGcmCryptoService, PasswordService],
})
export class SecurityModule {}
