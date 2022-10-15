import { Provider, Injectable } from '@opensumi/di';
import { BrowserModule } from '@opensumi/ide-core-browser';

import { PipelineContribution } from './pipeline-contribution';

@Injectable()
export class PipelineModule extends BrowserModule {
  providers: Provider[] = [PipelineContribution];
}
