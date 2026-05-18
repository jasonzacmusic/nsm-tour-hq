import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(parseInt(process.env.REMOTION_CONCURRENCY || '2', 10));
