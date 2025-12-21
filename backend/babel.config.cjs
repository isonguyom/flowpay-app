module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: { node: 'current' }, // for Jest running in Node
            },
        ],
    ],
};
