import { GraphQLError, Kind } from 'graphql';

export const MAX_QUERY_DEPTH = 6;

export const depthLimit = (maxDepth = MAX_QUERY_DEPTH) => (context) => {
    const fragments = Object.fromEntries(
        context
            .getDocument()
            .definitions.filter((def) => def.kind === Kind.FRAGMENT_DEFINITION)
            .map((def) => [def.name.value, def])
    );

    const measure = (selectionSet, depth, visited) => {
        let max = depth;
        for (const selection of selectionSet.selections) {
            if (selection.kind === Kind.FIELD) {
                if (selection.name.value.startsWith('__')) continue;
                const fieldDepth = selection.selectionSet
                    ? measure(selection.selectionSet, depth + 1, visited)
                    : depth + 1;
                max = Math.max(max, fieldDepth);
            } else if (selection.kind === Kind.INLINE_FRAGMENT) {
                max = Math.max(max, measure(selection.selectionSet, depth, visited));
            } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
                const name = selection.name.value;
                const fragment = fragments[name];
                if (!fragment || visited.has(name)) continue;
                max = Math.max(
                    max,
                    measure(fragment.selectionSet, depth, new Set(visited).add(name))
                );
            }
        }

        return max;
    };

    return {
        OperationDefinition(node) {
            const depth = measure(node.selectionSet, 0, new Set());
            if (depth > maxDepth) {
                context.reportError(
                    new GraphQLError(
                        `Query depth ${depth} exceeds the maximum allowed depth of ${maxDepth}`,
                        { nodes: [node], extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } }
                    )
                );
            }
        },
    };
};
