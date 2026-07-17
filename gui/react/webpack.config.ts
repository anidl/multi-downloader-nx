import type { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';

const config: Configuration = {
	entry: './src/index.tsx',
	mode: 'production',
	output: {
		path: path.resolve(process.cwd(), './build'),
		filename: 'index.js'
	},
	target: 'web',
	resolve: {
		extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
	},
	performance: false,
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							['@babel/typescript', { onlyRemoveTypeImports: false }],
							['@babel/preset-react', { development: false }],
							[
								'@babel/preset-env',
								{
									targets: 'defaults'
								}
							]
						]
					}
				}
			},
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader']
			}
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.join(process.cwd(), 'public', 'index.html')
		})
	]
};

export default config;
