import { Global, Module } from '@nestjs/common';
import { UndiciHttpClient } from './http-client';

@Global()
@Module({
  providers: [UndiciHttpClient],
  exports: [UndiciHttpClient],
})
export class HttpClientModule {}
