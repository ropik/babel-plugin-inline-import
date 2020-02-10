import BabelInlineImportHelper from './helper';
import transform from "css-to-react-native-transform";

export default function({ types: t }) {
  class BabelInlineImport {
    constructor() {
      return {
        visitor: {
          ImportDeclaration: {
            exit(path, state) {
              const givenPath = path.node.source.value;
              let reference = state && state.file && state.file.opts.filename;
              const extensions = state && state.opts && state.opts.extensions;
              const refextends = state && state.opts && state.opts.refextends;
              
              if (BabelInlineImportHelper.shouldBeInlined(reference, refextends) && BabelInlineImportHelper.shouldBeInlined(givenPath, extensions)) {
                if (path.node.specifiers.length > 1) {
                  throw new Error(`Destructuring inlined import is not allowed. Check the import statement for '${givenPath}'`);
                }

                const id = path.node.specifiers[0].local.name;
                const content = transform(BabelInlineImportHelper.getContents(givenPath, reference));
		const resultData = `JSON.parse("${JSON.stringify(content)}")`;
                const variable = t.variableDeclarator(t.identifier(id), t.objectExpression(content)); //t.stringLiteral(resultData));


                path.replaceWith({
                  type: 'VariableDeclaration',
                  kind: 'const',
                  declarations: [variable],
                  leadingComments: [
                    {
                      type: 'CommentBlock',
                      value: ` babel-plugin-inline-import '${givenPath}' `
                    }
                  ]
                });



              }
            }
          }
        }
      };
    }
  }

  return new BabelInlineImport();
}
