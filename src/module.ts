import { Module, VNode } from "snabbdom";

export type SyncVNode = VNode | (() => VNode);

declare module 'snabbdom' {
    export interface AttachData {
        sync?: SyncVNode;
    }
}

function commitVNode(vnode: VNode, parentVnode: VNode) {
    const path: number[] = [];

    if (!vnode.elm || !parentVnode.elm || !parentVnode.children) {
        return;
    }

    function find(child: Node, root: Node): void {
        let index = 0;
        let found = false;
        const parent = child.parentNode;

        if (!parent) {
            throw new Error('NOTFOUND');
        }

        for (const node of parent.childNodes) {
            if (node == child) {
                path.unshift(index);
                found = true;
                break;
            }

            index ++;
        }

        if (!found) {
            throw new Error('NOTFOUND');
        }

        if (parent == root) {
            return;
        } else {
            return find(parent, root);
        }
    }

    try {
        find(vnode.elm, parentVnode.elm);
    } catch {
        return;
    }

    let count = 0
    let current: VNode = parentVnode;

    for (const index of path) {
        count ++;
        const children = current.children as VNode[];

        if (count == path.length) {
            children[index] = vnode;
        } else {
            current = children[index] as VNode;
        }
    }
}

let parent: SyncVNode | null | undefined;
let current: VNode | null;

function update(oldVNode: VNode, vnode: VNode): void {
    parent = vnode.data?.attachData?.sync ?? oldVNode.data?.attachData?.sync;

    if (!parent) {
        return;
    }

    current = vnode;
}

function post() {
    if (!current) {
        return;
    }

    if (!parent) {
        parent = current.data?.attachData?.sync;
    }

    if (!parent) {
        return;
    }

    commitVNode(current, parent instanceof Function ? parent() : parent);
    current = null;
    parent = null;
}

export const syncModule: Module = { update, post }
