import { GraphQLModule } from '@nestjs/graphql';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from 'nestjs-prisma';
import { BullModule } from '@nestjs/bull';
import { QueueOptions } from 'bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { PostsModule } from 'src/posts/posts.module';
import config from 'src/common/configs/config';
import { loggingMiddleware } from 'src/common/middleware/logging.middleware';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GqlConfigService } from './gql-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: () => {
        const logger = new Logger('PrismaMiddleware');
        return { middlewares: [loggingMiddleware(logger)] }; // configure your prisma middleware
      },
    }),
    // GraphQLModule.forRoot({
    //   driver: ApolloDriver,
    //   autoSchemaFile: true,
    // }),
    // GraphQLModule.forRootAsync<ApolloDriverConfig>({
    //   driver: ApolloDriver,
    //   useFactory: async (configService: ConfigService) => {
    //     const graphqlConfig = configService.get<GraphqlConfig>('graphql');
    //     return {
    //       // installSubscriptionHandlers: true,
    //       // buildSchemaOptions: {
    //       //   numberScalarMode: 'integer',
    //       // },
    //       // sortSchema: graphqlConfig.sortSchema,
    //       // autoSchemaFile:
    //       //   graphqlConfig.schemaDestination || './src/schema.graphql',
    //       // debug: graphqlConfig.debug,
    //       // playground: graphqlConfig.playgroundEnabled,
    //       // context: ({ req }) => ({ req }),
    //     };
    //   },
    //   inject: [ConfigService],
    // }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useClass: GqlConfigService,
    }),
    BullModule.registerQueueAsync({
      name: 'nest-worker',
      useFactory: async (configService: ConfigService) => {
        const bullConfig = await configService.get<QueueOptions>('bull');
        return bullConfig;
      },
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
