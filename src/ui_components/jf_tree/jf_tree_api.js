export function JFTreeApi($q) {
	'ngInject';
	class JFTreeApiClass {
		/* @ngInject */
        constructor(appScope) {
            this.$root = [];
            this.$openedNodes = [];
            this.$flatItems = [];
            this.actions = [];
            this.listeners = {};
            this.supportedEvents = ['pagination.change', 'item.clicked'];
            this.appScope = appScope;
            this._setDefaults();
        }

        setNodeTemplate(nodeTemplate) {
            this.nodeTemplate = nodeTemplate;
            return this;
        }

        setTreeData(rootData) {
            this.$root = rootData;
            this._buildFlatItems();
        }

        setChildrenGetter(childrenGetter) {
            this.childrenGetter = childrenGetter;
            this.getChildren(null).then(rootData => {
                if (rootData && rootData.length) this.setTreeData(rootData)
            })
            return this;
        }

        setChildrenChecker(childrenChecker) {
            this.childrenChecker = childrenChecker;
            return this;
        }

        update() {
            if (this.dirCtrl) {
                this.dirCtrl.refresh();
            }
        }

        isNodeOpen(node) {
            return _.includes(this.$openedNodes, node);
        }

        _flatFromNode(node) {
            return _.find(this.$flatItems, flat => flat.data === node);
        }

        openNode(node) {
            if (!_.includes(this.$openedNodes, node)) {
                this.$openedNodes.push(node);
                let flat = this._flatFromNode(node);
                this.getChildren(node).then(children => {
                    this._addChildren(children, flat.level + 1, flat);
                })
            }
        }

        closeNode(node) {
            if (_.includes(this.$openedNodes, node)) {
                _.remove(this.$openedNodes, n => n === node);
                let flat = this._flatFromNode(node);
                this._removeChildren(flat)
            }
        }

        getChildren(node) {
            let childrenOrPromise = this.childrenGetter(node);
            if (childrenOrPromise && childrenOrPromise.then) {
                return childrenOrPromise;
            }
            else {
                let defer = $q.defer();
                defer.resolve(childrenOrPromise || []);
                return defer.promise;
            }
        }

        _createFlatItem(node, level = 0, parent = null) {
            let flat = {
                data: node,
                level,
                parent,
                hasChildren: undefined
            }

            if (this.childrenChecker) {
                let check = this.childrenChecker(node);
                if (check && check.then) {
                    check.then((_check) => {
                        flat.hasChildren = _check;
                    })
                }
                else flat.hasChildren = check;
            }
            else {
                this.getChildren(node).then(children => {
                    flat.hasChildren = !!(children && children.length);
                });
            }

            return flat;
        }

        _addChildren(children, level = 0, parent = null) {
            let parentIndex = this.$flatItems.indexOf(parent);
            let added = [];
            children.forEach((node, i) => {
                let flatItem = this._createFlatItem(node, level, parent);
//                this.$flatItems.splice(parentIndex + 1 + i, 0, flatItem);
                added.push(flatItem);
                if (this.isNodeOpen(node)) {
                    this.getChildren(node).then(_children => {
                        if (_children && _children.length) {
                            this._addChildren(_children, level + 1, flatItem);
                        }
                    })
                }
            })
            let before = this.$flatItems.slice(0, parentIndex + 1);
            let after = this.$flatItems.slice(parentIndex + 1);
            this.$flatItems = before.concat(added).concat(after);
            this.update();
        }

        _removeChildren(parent) {
            this.$flatItems = _.filter(this.$flatItems, flat => {
                let remove = false;
                let _parent = flat.parent;
                while (_parent) {
                    if (_parent  === parent) {
                        remove = true;
                        break;
                    }
                    _parent = _parent.parent;
                }
                return !remove;
            })
            this.update();

        }

        _buildFlatItems() {
            this.$flatItems = [];
            this._addChildren(this.$root);
        }

        _setDefaults() {
            this.objectName = 'Item';
            this.itemHeight = '50px';
            this.itemsPerPage = 25;
        }

        on(event, listener) {
            if (!_.includes(this.supportedEvents, event)) {
                console.error('jf-tree: Unsupported Event: ' + event);
                return;
            }
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(listener);
        }

        off(event, listener) {
            if (!_.includes(this.supportedEvents, event)) {
                console.error('jf-tree: Unsupported Event: ' + event);
                return;
            }
            if (this.listeners[event]) {
                if (listener) {
                    _.remove(this.listeners[event],l=>l===listener);
                }
                else {
                    this.listeners[event] = [];
                }
            }
        }

        fire(event, ...params) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(listener=>listener(...params))
            }
        }

        setItemsPerPage(rpp) {
            this.itemsPerPage = rpp;
            return this;
        }

        setObjectName(objectName, useAn = false) {
            this.objectName = objectName;
            this.useAnWithObjectName = useAn;
            return this;
        }

        setItemHeight(height) {
            this.itemHeight = height;
            return this;
        }

        sortBy() {
            return this;
        }

        setActions(actions) {
            this.actions = actions;
            return this;
        }

        _setDirectiveController(ctrl) {
            this.dirCtrl = ctrl;
        }

        setEmptyTreeText(text) {
            this.emptyTreeText = text;
            return this;
        }

        _getPageData() {
            return this._getPrePagedData().slice(this.dirCtrl.virtualScrollIndex,
                this.dirCtrl.virtualScrollIndex + this.itemsPerPage);
        }

        _getPrePagedData() {
            return this._getSortedData(this._getFilteredData(this._getRawData()));
        }

        _getSortedData(sourceData) {
			return sourceData;
        }

        _getFilteredData(sourceData) {
			return sourceData;
        }

        _getRawData() {
            return this.$flatItems || [];
        }

	}
	return JFTreeApiClass;

}


