// Load modules
const pluralize = require('pluralize');
const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const sinon = require('sinon');

// Define shortcuts
const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const beforeEach = lab.beforeEach;
const after = lab.after;
const expect = Code.expect;

const ORM = require('./helpers/orm-bookshelf');
const User = ORM.Models.User;
const server = require('./helpers/server-hapi').init();


describe('Module', () => {
    before((done) => {
        done();
    });

    it('should return an error if no server object was passed', (done) => {
        try {
            const Api = require('..')();
        } catch (err) {
            expect(err.message).to.equal('No http engine given!');
        }

        done();
    });

    it('should return the server object on getServer', (done) => {
        const Api = require('..')(server);
        expect(Api.getServer().version).to.equal(server.version);

        done();
    });

    it ('should return an error if no model was passed to generate', (done) => {
        const Api = require('..')(server);

        try {
            Api.generate();
        } catch (err) {
            expect(err.message).to.equal('Invalid Base Model Specified');
        }

        done();
    });

    it('should return an error on an incorrect options scheme', (done) => {
        const Api = require('..')(server);

        try {
            Api.generate(User, { something: 'wrong' });
        } catch (err) {
            expect(err.message).to.equal('ValidationError: "something" is not allowed');
        }

        done();
    });

    it('should use a authentication plugin if one is added through addAuthentication', (done) => {
        const server = require('./helpers/server-hapi').init();
        const Api = require('..')(server);

        const roadworkAuthentication = require('roadwork-authentication');
        const checkRequiredSchemeStub = sinon.stub(roadworkAuthentication.prototype, 'checkRequiredScheme', function () { return Promise.resolve(); });

        Api.addAuthentication(roadworkAuthentication, {})
        .then(() => {
            checkRequiredSchemeStub.restore();
            sinon.assert.calledWith(checkRequiredSchemeStub);

            done();
        });
    });

    it('should still work with bearer authentication if the plugin is already registered', (done) => {
        const server = require('./helpers/server-hapi').init();
        const Api = require('..')(server);

        const roadworkAuthentication = require('roadwork-authentication');
        const stub = sinon.stub(roadworkAuthentication.prototype, 'init', function () { return Promise.resolve(); });

        Api.addAuthentication(require('roadwork-authentication'), {})
        .then(() => {
            return Api.addAuthentication(require('roadwork-authentication'), {})
        })
        .then(() => {
            stub.restore();
            sinon.assert.calledWith(stub);

            done();
        });
    });

    it('should throw an error when adding authentication if no library plugin was specified', (done) => {
        const server = require('./helpers/server-hapi').init();
        const Api = require('..')(server);

        Api.addAuthentication(null, {})
        .catch((err) => {
            expect(err.message).to.equal("Missing the authenticationLibrary");
            done();
        });
    });

    it('should throw an error when no database configuration was passed', (done) => {
        const server = require('./helpers/server-hapi').init();
        const Api = require('..')(server);

        Api.addAuthentication(require('roadwork-authentication'))
        .catch((err) => {
            expect(err.message).to.equal("Missing the bookshelf object");
            done();
        });
    });
});