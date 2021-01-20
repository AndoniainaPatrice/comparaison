var app = new Vue({
    el: '#app',
    delimiters: ['{-', '-}'],
    data: {
        rightArrow: null,
        rightWeb: null,
        goto: null,
        uri: null,
        photo: null,
        // dots: [],
        // arrows: [],
        dotSize: 2,
        popUp: false,
        popUpEdit: false,
        playing: false,
        opened: -1,
        opened2: -1,
        root: true,
        title: null,
        fullScreen: false,
        message: 'Hello Vue !',
        modal: false,
        left: false,
        right: false,
        size: 1.5,
        idx: -1,
        url: null,
        sceneIDX: 0,
        image: null,
        modalTitle: '',
        modalContent: '',
        mode: 0,
        scenes: [],
        uploadPercentage: 0,
        maxUploadPercentage: 100,
        isUpload: false,
        defaultOrigin: '0 -140 0',
        origin: '0 -140 0'
    },
    computed: {
        scene () {
            return this.scenes[this.sceneIDX] || {}
        },
        options () {
            return this.scenes.map(scene => ({ text: scene.name, value: scene.aId}))
        },
        productOptions () {
            return products.map(product => ({ text: product.title, value: product}))
        },
        sky() {
            return this.scene && this.scene.attributes ? this.scene.attributes.img : null;
        },
        collection () {
            return this.scenes.filter(scene => scene.attributes.collection !== undefined && (scene.attributes.collection !== null && scene.attributes.collection.length > 0))
        },
        scenesCollection () {
            return this.collection.map(scene => ({ text: scene.attributes.collection, value: scene.aId}));
        },
    },
    async mounted () {
        this.scenes = await this.load();
        this.sceneIDX = 0;
        this.initOneScene();
    },
    watch: {
        sceneIDX () {
        }
    },
    methods: {
        uuid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        initOneScene () {
            if (this.scene) {
                this.origin = this.scene.coordinates && !isNaN(this.scene.coordinates.x) ?
                    `${this.scene.coordinates.x} ${this.scene.coordinates.y} ${this.scene.coordinates.z}`
                    : this.defaultOrigin;
                console.log(this.origin);
                this.$forceUpdate()
            }
        },
        async load(){
            return await this.$axios.get(loadUri, {
                onDownloadProgress: ( progressEvent ) => {
                    this.uploadPercentage = parseInt( Math.round( ( progressEvent.loaded / progressEvent.total ) * 100 ))
                }
            });
        },
        async save(){
            await this.$axios.post(saveUri, JSON.stringify({scenes: this.scenes}), {
                onDownloadProgress: ( progressEvent ) => {
                    this.uploadPercentage = parseInt( Math.round( ( progressEvent.loaded / progressEvent.total ) * 100 ))
                },
                headers: {
                    'content-type': 'application/json',
                }
            });
        },
        async uploadPhoto(file){
            let uri = uploadUri;
            let formData = new FormData();
            formData.append('file', file);
            return await this.$axios.post(uri, formData, {
                onUploadProgress: ( progressEvent ) => {
                    this.uploadPercentage = parseInt( Math.round( ( progressEvent.loaded / progressEvent.total ) * 100 ))
                }
            });
        },
        setView () {
            var coo = this.$refs.asky.object3D.getWorldQuaternion();
            console.log(this.scene, coo);
            this.scene.coordinates = { x: parseFloat(coo._x).toFixed(2), y: parseFloat(coo._y).toFixed(2), z: parseFloat(coo._z).toFixed(2) }
        },
        del (idx) {
            this.scene.entities.splice(idx, 1)
        },
        addScene () {
            this.scenes = [...this.scenes, {
                name: 'New scene',
                id: null,
                aId: this.uuid(),
                coordinates: null,
                attributes: {
                    img: null
                },
                entities: [
                ]
            }]
        },
        delScene (idx){
            this.scenes.splice(idx, 1)
        },
        gotoScene (idx) {
            this.sceneIDX = idx;
            this.initOneScene();
            this.$forceUpdate();
        },
        zoom (posZ) {
            return 25*posZ//posZ
        },
        close (en) {
            en.params = false
            this.$forceUpdate()
        },
        params (type, idx) {
            if (this.mode === 1) {
                if (type === 'web') {
                    this.modal = true
                    if (this.scene.entities[idx] && this.scene.entities[idx].attributes && this.scene.entities[idx].attributes.url) {
                        this.url = this.scene.entities[idx].attributes.url
                    } else {
                        this.url = null
                    }
                } else {
                    if (this.scene.entities[idx] && this.scene.entities[idx].attributes.goto) {
                        for (let i=0;i<this.scenes.length;i++) {
                            if (this.scenes[i].aId === this.scene.entities[idx].attributes.goto) {
                                this.gotoScene(i);
                                break;
                            }
                        }
                    }
                }
            } else {
                this.rightWeb = this.rightArrow = false
                this.idx = idx;
                for(let i=0;i<this.scene.entities.length;i++) {
                    this.scene.entities[i].params = i == idx
                }
                this.$forceUpdate()
            }
        },
        addElement (type) {
            const pos = this.$refs.cur.object3D.getWorldPosition()
            const rot = this.$refs.cam.object3D.rotation//this.$refs.cur.object3D.getWorldQuaternion()
            const zoom = this.zoom(pos.z)
            const d = zoom / pos.z
            pos.z = zoom
            pos.x = pos.x * d
            pos.y = pos.y * d
            if (type === 'web') {
                this.scene.entities.push({aId: this.uuid(), lookAt: '[camera]', type, coordinates: {x: pos.x, y: pos.y, z: pos.z}, rotation: {x: rot.x, y: rot.y, z: rot.z}, attributes: {}})
            } else if (type === 'arrow') {
                this.scene.entities.push({aId: this.uuid(), lookAt: '[camera]', type, coordinates: {x: pos.x, y: pos.y, z: pos.z}, rotation: {x: rot.x, y: rot.y, z: rot.z}, attributes: {}})
            }
            var i = this.scene.entities.length - 1;
            setTimeout(x => {
                var rot = this.$refs['c' + i][0].getAttribute('rotation')
                this.scene.entities[i].rot = 'i' + JSON.stringify(rot)
                this.scene.entities[i].rotation.x = rot.x;
                this.scene.entities[i].rotation.y = rot.y;
                this.scene.entities[i].rotation.z = rot.z;
                this.scene.entities[i].lookAt = null
                this.$forceUpdate()
            }, 1)
        },
        async handleFile (file) {
            this.isUpload = true;
            let res = await this.uploadPhoto(file).catch(e => this.isUpload = false);
            if (res.url) {
                this.scene.attributes.img = res.url
            } else {
            }
            this.isUpload = false
        },
        showModal(title, content) {
            this.modalTitle = title || 'Alert';
            this.modalContent = content || "Une erreur s'est produite";
            this.$refs['my-modal'].show()
        },
        hideModal() {
            this.$refs['my-modal'].hide()
        }
    }
});