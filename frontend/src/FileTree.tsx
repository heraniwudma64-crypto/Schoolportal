import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { useMemo, useState } from 'react';

type TreeNode = {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: string;
  modified?: string;
  children?: TreeNode[];
};

type FlatNode = TreeNode & {
  depth: number;
  hasChildren: boolean;
};

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query.trim()) return nodes;
  const normalized = query.toLowerCase().trim();

  function walk(node: TreeNode): TreeNode | null {
    const selfMatches = node.name.toLowerCase().includes(normalized);
    const children = node.children
      ?.map(walk)
      .filter((child): child is TreeNode => child !== null);

    if (selfMatches || (children && children.length > 0)) {
      return { ...node, children };
    }

    return null;
  }

  return nodes.map(walk).filter((node): node is TreeNode => node !== null);
}

function collectVisibleNodes(nodes: TreeNode[], expanded: Set<string>, depth = 0): FlatNode[] {
  const visible: FlatNode[] = [];

  for (const node of nodes) {
    const hasChildren = node.type === 'folder' && !!node.children?.length;
    visible.push({ ...node, depth, hasChildren });

    if (hasChildren && expanded.has(node.id)) {
      visible.push(...collectVisibleNodes(node.children!, expanded, depth + 1));
    }
  }

  return visible;
}

function collectExpandedAncestorIds(nodes: TreeNode[], ids: Set<string>) {
  for (const node of nodes) {
    if (node.type === 'folder' && node.children?.length) {
      ids.add(node.id);
      collectExpandedAncestorIds(node.children, ids);
    }
  }
}

function folderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M4 7.25C4 6.007 5.007 5 6.25 5h3.6c.4 0 .78.15 1.06.41l.54.5h6.31C18.993 5.91 20 6.917 20 8.16v7.84c0 1.243-1.007 2.25-2.25 2.25H6.25A2.25 2.25 0 0 1 4 16V7.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function fileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M6 3.75H13.5L18.25 8.5V18.75C18.25 19.716 17.466 20.5 16.5 20.5H7.5C6.534 20.5 5.75 19.716 5.75 18.75V5.75C5.75 4.784 6.534 4 7.5 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 3.75V8.5H18.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function chevronIcon(open: boolean) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden>
      <path d="M8.5 7.75L14 12.25L8.5 16.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function createDefaultExpanded(nodes: TreeNode[]) {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'folder') {
      ids.add(node.id);
      node.children?.forEach((child) => {
        if (child.type === 'folder') ids.add(child.id);
      });
    }
  }
  return ids;
}

export default function FileTree({ nodes }: { nodes: TreeNode[] }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => createDefaultExpanded(nodes));

  const filteredNodes = useMemo(() => filterTree(nodes, search), [nodes, search]);

  const expandedWithSearch = useMemo(() => {
    if (!search.trim()) return expanded;
    const autoExpanded = new Set(expanded);
    collectExpandedAncestorIds(filteredNodes, autoExpanded);
    return autoExpanded;
  }, [expanded, filteredNodes, search]);

  const visibleNodes = useMemo(
    () => collectVisibleNodes(filteredNodes, expandedWithSearch),
    [filteredNodes, expandedWithSearch],
  );

  const toggleNode = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">File Explorer</h2>
          <p className="mt-1 text-sm text-slate-500">Collapsible tree with virtualization and search.</p>
        </div>
        <label className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 sm:w-auto">
          <span>🔎</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Filter files and folders"
          />
        </label>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
        {visibleNodes.length === 0 ? (
          <div className="min-h-[260px] px-6 py-16 text-center text-sm text-slate-500">
            No files or folders match your search.
          </div>
        ) : (
          <List
            height={560}
            itemCount={visibleNodes.length}
            itemSize={44}
            width="100%"
            itemKey={(index) => visibleNodes[index].id}
          >
            {({ index, style }: ListChildComponentProps) => {
              const node = visibleNodes[index];
              const padding = 16 + node.depth * 18;
              const isFolder = node.type === 'folder';
              const isOpen = expandedWithSearch.has(node.id);

              return (
                <div
                  style={style}
                  className="flex cursor-pointer items-center gap-3 border-b border-slate-200 bg-white px-4 transition-colors hover:bg-slate-50"
                  onClick={() => isFolder && toggleNode(node.id)}
                  role={isFolder ? 'button' : undefined}
                  tabIndex={isFolder ? 0 : undefined}
                  onKeyDown={(event) => {
                    if (isFolder && event.key === 'Enter') {
                      toggleNode(node.id);
                    }
                  }}
                >
                  <div style={{ paddingLeft: padding }} className="flex min-w-0 items-center gap-2">
                    {isFolder ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        {chevronIcon(isOpen)}
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        {fileIcon()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        {isFolder ? folderIcon() : fileIcon()}
                        <span className="truncate">{node.name}</span>
                      </div>
                      {node.type === 'file' && node.size ? (
                        <div className="text-xs text-slate-500">{node.size}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            }}
          </List>
        )}
      </div>
    </div>
  );
}
