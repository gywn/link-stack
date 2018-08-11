import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default ['background', 'content-persistent', 'view'].map(basename => ({
  input: `.ts_temp/${basename}.js`,
  output: {
    file: `dist/${basename}.js`,
    format: 'iife'
  },
  plugins: [
    resolve(), // put node modules into import paths
    replace({
      'process.env.NODE_ENV': JSON.stringify( 'production' )
    }),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'node_modules/react-dom/index.js': [
          'render',
          'findDOMNode',
          'createPortal',
        ],
        'node_modules/react/index.js': [
          'Component',
          'PropTypes',
          'createElement',
          'cloneElement',
          'createContext',
        ]
      }
    }), // transform CommonJS format into ES6
  ]
}));