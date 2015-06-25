'use strict';

var _ = require('lodash');

module.exports = function (context) {
    var possibleAsyncFunctionNames = [
        'it',
        'it.only',
        'test',
        'test.only',
        'before',
        'after',
        'beforeEach',
        'afterEach'
    ];

    function getCalleeName(callee) {
        if (callee.type === 'MemberExpression') {
             return callee.object.name + '.' + callee.property.name;
        }

        return callee.name;
    }

    function hasParentMochaFunctionCall(functionExpression) {
        var name;

        if (functionExpression.parent && functionExpression.parent.type === 'CallExpression') {
            name = getCalleeName(functionExpression.parent.callee);
            return possibleAsyncFunctionNames.indexOf(name) > -1;
        }

        return false;
    }

    function isAsyncFunction(functionExpression) {
        return functionExpression.params.length === 1;
    }

    function findParamInScope(paramName, scope) {
        return _.find(scope.variables, function (variable) {
            return variable.name === paramName && variable.defs[0].type === 'Parameter';
        });
    }

    function checkAsyncMochaFunction(functionExpression) {
        var scope = context.getScope(),
            callback = functionExpression.params[0],
            callbackName = callback.name,
            callbackVariable = findParamInScope(callbackName, scope);

        if (callbackVariable && callbackVariable.references.length === 0) {
            context.report(callback, 'Expected "{{name}}" callback to be handled.', { name: callbackName });
        }
    }

    function check(node) {
        if (hasParentMochaFunctionCall(node) && isAsyncFunction(node)) {
            checkAsyncMochaFunction(node);
        }
    }

    return {
        FunctionExpression: check,
        ArrowFunctionExpression: check
    };
};