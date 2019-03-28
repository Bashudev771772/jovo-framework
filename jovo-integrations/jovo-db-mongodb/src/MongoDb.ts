import {Db, BaseApp, PluginConfig, JovoError, ErrorCode} from 'jovo-core';
import _merge = require('lodash.merge');
import _get = require('lodash.get');
import { MongoClient } from 'mongodb';

export interface Config extends PluginConfig {
    uri?: string;
    databaseName?: string;
    collectionName?: string;
    primaryKeyColumn?: string;
}

export class MongoDb implements Db {
    config: Config = {
        uri: undefined,
        databaseName: undefined,
        collectionName: 'UserData',
        primaryKeyColumn: 'userId',
    };
    needsWriteFileAccess = false;
    isCreating = false;
    client?: MongoClient;

    constructor(config?: Config) {
        if (config) {
            this.config = _merge(this.config, config);
        }
    }

    async install(app: BaseApp) {
        this.errorHandling();

        this.client = await this.getConnectedMongoClient(this.config.uri!);

        if (_get(app.config, 'db.default')) {
            if (_get(app.config, 'db.default') === 'MongoDb') {
                app.$db = this;
            }
        } else {
            app.$db = this;
        }
    }

    uninstall(app: BaseApp) {
    }

    async getConnectedMongoClient(uri: string): Promise<MongoClient> {
        return await MongoClient.connect(uri, { useNewUrlParser: true });
    }

    errorHandling() {
        if (!this.config.uri) {
            throw new JovoError(
                'uri has to be set.',
                ErrorCode.ERR_PLUGIN,
                'jovo-db-mongodb',
                undefined,
                undefined,
                'https://www.jovo.tech/docs/databases/mongodb'
            );
        }

        if (!this.config.primaryKeyColumn) {
            throw new JovoError(
                'primaryKeyColumn has to be set.',
                ErrorCode.ERR_PLUGIN,
                'jovo-db-mongodb',
                undefined,
                undefined,
                'https://www.jovo.tech/docs/databases/mongodb'
            );
        }

        if (!this.config.databaseName) {
            throw new JovoError(
                'databaseName has to be set.',
                ErrorCode.ERR_PLUGIN,
                'jovo-db-mongodb',
                undefined,
                undefined,
                'https://www.jovo.tech/docs/databases/mongodb'
            );
        }

        if (!this.config.collectionName) {
            throw new JovoError(
                'collectionName has to be set.',
                ErrorCode.ERR_PLUGIN,
                'jovo-db-mongodb',
                undefined,
                undefined,
                'https://www.jovo.tech/docs/databases/mongodb'
            );
        }
    }

    /**
     * Returns object for given primaryKey
     * @param {string} primaryKey
     * @return {Promise<any>}
     */
    async load(primaryKey: string): Promise<any> { // tslint:disable-line
        try {
            const collection = this.client!.db(this.config.databaseName!).collection(this.config.collectionName!);
            const doc = await collection.findOne({ userId: primaryKey });
            return doc;
        } catch (e) {
            throw new JovoError(
                e.message,
                ErrorCode.ERR_PLUGIN,
                'jovo-db-mongodb',
                undefined,
                'Make sure the configuration you provided is valid.',
                'https://www.jovo.tech/docs/databases/mongodb'
            );
        }
    }

    async save(primaryKey: string, key: string, data: any) { // tslint:disable-line
        this.errorHandling();

        try {
            const collection = this.client!.db(this.config.databaseName!).collection(this.config.collectionName!);
            const item = {
                $set: {
                    [this.config.primaryKeyColumn!]: primaryKey,
                    [key]: data
                }
            };
            await collection.updateOne({ userId: primaryKey }, item, { upsert: true });
        } catch (e) {
            throw new JovoError(
                e.message,
                ErrorCode.ERR_PLUGIN,
                'jovo-db-mongodb',
                undefined,
                'Make sure the configuration you provided is valid.',
                'https://www.jovo.tech/docs/databases/mongodb'
            );
        }
    }

    async delete(primaryKey: string) {
        try {
            const collection = this.client!.db(this.config.databaseName!).collection(this.config.collectionName!);
            await collection.deleteOne({ userId: primaryKey });
        } catch (e) {
            throw new JovoError(
                e.message,
                ErrorCode.ERR_PLUGIN,
                'jovo-db-mongodb',
                undefined,
                'Make sure the configuration you provided is valid.',
                'https://www.jovo.tech/docs/databases/mongodb'
            );
        }
    }
}
