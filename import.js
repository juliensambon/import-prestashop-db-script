#!/usr/bin/env node

const yargs = require('yargs');
const { exec } = require('child_process');
const mysql = require('mysql');
const dbConfig = require('./config/db.config');

const argv = yargs
    .option('database', {
        alias: 'db',
        description: 'Name of database.',
        demandOption: 'Database is required.',
        type: 'string',
    })
    .option('sql-file', {
        alias: 's',
        description: 'Path to sql file.',
        demandOption: 'Path to sql file is required.',
        type: 'string',
    })
    .option('domain', {
        alias: 'd',
        description: 'Domain name prestashop.',
        demandOption: 'Domain name prestashop is required.',
        type: 'string',
    })
    .option('use-cache', {
        description: 'Active prestashop cache (smarty, css, js).',
        default: false,
        type: 'boolean',
    })
    .option('use-mail', {
        description: 'Active prestashop mail.',
        default: false,
        type: 'boolean',
    })
    .option('use-ssl', {
        description: 'Active prestashop ssl.',
        default: false,
        type: 'boolean',
    })
    .option('disable-modules', {
        description: 'Disable modules (separate module by space).',
        default: [],
        type: 'array',
    })
    .help()
    .alias('help', 'h')
    .argv
;

function getConfigurationQueries() {
    const configurationQueries = [
        {
            message: 'Mis à jour du nom de domaine...',
            sql: 'UPDATE ps_shop_url SET domain = \'' + argv.domain + '\', domain_ssl = \'' + argv.domain + '\';',
        },
        {
            message: argv.useSsl ? 'Activation du ssl...' : 'Désactivation du ssl...' ,
            sql: 'UPDATE ps_configuration SET value = \'' + (argv.useSsl ? 1 : 0) + '\' WHERE name LIKE \'PS_SSL_ENABLED%\';',
        },
        {
            message: argv.useMail ? 'Activation de l\'envoi de mail...' : 'Désactivation de  l\'envoi de mail...',
            sql: 'UPDATE ps_configuration SET value = \'' + (argv.useMail ? 1 : 3) + '\' WHERE name = \'PS_MAIL_METHOD\';',
        },
        {
            message: argv.useCache ? 'Activation du cache' : 'Désactivation du cache...',
            sql: 'UPDATE ps_configuration SET value = \'' + (argv.useCache ? 1 : 0) + '\' WHERE name = \'PS_SMARTY_CACHE\' ' +
                'OR name = \'PS_CSS_THEME_CACHE\'' +
                'OR name = \'PS_JS_THEME_CACHE\';',
        },
    ];

    if (argv.disableModules.length > 0) {
        argv.disableModules.forEach((module) => {
            configurationQueries.push({
                message: 'Désactivation du module : ' + module,
                sql: 'UPDATE ps_module SET active = \'0\' WHERE name = \'' + module + '\';',
            });
        });
    }
    return configurationQueries;
}

function importDataBase()
{
    return new Promise(resolve => {
        const shellCommand = 'mysql -h ' + dbConfig.host + ' -u ' + dbConfig.user + ' -p ' + argv.database + ' < ' + argv.sqlFile;
        exec(shellCommand, (error, stdout, stderr) => {
            if (error) {
                console.log(error.message);
                resolve(false);
            }

            resolve(true);
        });
    });
}

function updateDatabase() {
    return new Promise(resolve => {
        const connection = mysql.createConnection({
            database: argv.database,
            ...dbConfig
        });

        connection.connect(function (error) {
           if (error) throw error;
            const configurationQueries = getConfigurationQueries();
            configurationQueries.forEach((query, index) => {
                connection.query(query.sql, function (error, result) {
                    if (error) throw error;

                    if (query.message) {
                        console.log(query.message);
                        console.log(result.affectedRows + ' ligne(s) affectée(s).');
                    }

                    if (index === configurationQueries.length - 1) {
                        resolve();
                    }
                });
            });
        });
    });
}

async function run() {
    console.log('Import de la base de données avec l\'utilisateur : ' + dbConfig.user);
    const databaseIsImported = await importDataBase();

    if (!databaseIsImported) {
        console.log('Une erreur est survenue lors de l\'import.');
        process.exit(1);
    }

    console.log('La base de données a bien été importée.');

    await updateDatabase();
    process.exit();
}

run();