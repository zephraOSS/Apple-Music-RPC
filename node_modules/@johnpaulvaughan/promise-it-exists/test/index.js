var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-files'));
var file = require('chai-files').file;
var expect = require('chai').expect;
var should = require('chai').should;

var promiseIt = require('../index');



describe('#promiseItExists', () => {
    it('should return a string if exists', () => {
        let goodFile = require('path').basename(__dirname) + "/good file.txt";
        return promiseIt.exists(goodFile).then((result) => expect(result).to.be.a('string'))
    })
    it('should throw "File does not exist" error if file is not accessible', () => {
        let badFile = require('path').basename(__dirname) + "/fake-file-name.txt";
        return expect(promiseIt.exists(badFile)).to.be.rejectedWith('File does not exist')
    })
})
