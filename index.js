var app = new Vue({
    el: '#app',
    data: {
        rightArrow: null,
        rightWeb: null,
        goto: null,
        uri: null,
        photo: null,
        zoom: '2',
        sary: '/PANO16DEF.jpg',
        rootSary: '/PANO16DEF.jpg',
        // dots: [],
        // arrows: [],
        dotSize: 2,
        size: 0.4,
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
        sceneIDX: -1,
        image: null,
        modalTitle: '',
        modalContent: '',
        mode: 0,
        scenes: [
            {
                name: 'Scene 1',
                coordinates: null,
                id: '1',
                attributes: {
                    img: '/PANO16DEF.jpg'
                },
                entities: [
                ]
            }
        ],
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
            return this.scenes.map(scene => ({ text: scene.name, value: scene.id}))
        }
    },
    async mounted () {
        let a = await this.load()
        if(a && a.length) {
            this.scenes = a;
            this.sceneIDX = 0
            this.initOneScene();
        } else {
            this.scene.IDX = 0
        }
        console.log('aaaa', a)
    },
    watch: {
        sceneIDX () {
            // this.initOneScene();
        }
    },
    methods: {
        initOneScene () {
            if(this.scene) {
                if (this.scene.attributes && this.scene.attributes.img) {
                    this.sary = this.scene.attributes.img
                }
                this.origin = this.scene.coordinates && !isNaN(this.scene.coordinates.x) ? 
                    `${this.scene.coordinates.x} ${this.scene.coordinates.y} ${this.scene.coordinates.z}`
                    : this.defaultOrigin
            }
            this.$forceUpdate()
        },
        async load(){
            let response = await this.$axios.get(loadUri, {
                onDownloadProgress: ( progressEvent ) => {
                    this.uploadPercentage = parseInt( Math.round( ( progressEvent.loaded / progressEvent.total ) * 100 ))
                }
            })
            return response
        },
        async save(){
            let response = await this.$axios.post(saveUri, {scenes: this.scenes}, {
                onDownloadProgress: ( progressEvent ) => {
                    this.uploadPercentage = parseInt( Math.round( ( progressEvent.loaded / progressEvent.total ) * 100 ))
                }
            })
            alert('Sauvegarde effectuée')
            console.log('res', response)
        },
        async uploadPhoto(data){
            let uri = `/adminapi/v1/photos/upload`;
            let formData = new FormData();
            for(const field in data){
                formData.append(field, data[field]);
            }
            console.log(formData.entries(), data)
            let response = await this.$axios.post(uri, formData, {
                onUploadProgress: ( progressEvent ) => {
                    this.uploadPercentage = parseInt( Math.round( ( progressEvent.loaded / progressEvent.total ) * 100 ))
                }
            })
            return response
        },
        setView () {
            // var coo = this.$refs.cam.object3D.getWorldPosition()
            // var coo = this.$refs.cur.object3D.getWorldPosition()
            // var coo = this.$refs.cam.object3D.getWorldQuaternion()
            // var coo = this.$refs.cam.object3D.position
            var coo = this.$refs.asky.object3D.getWorldQuaternion()
            console.log(coo)
            this.scene.coordinates = { x: parseFloat(coo._x).toFixed(2), y: parseFloat(coo._y).toFixed(2), z: parseFloat(coo._z).toFixed(2) }
            // this.scene.coordinates = { x: coo.x, y: coo.y, z: coo.z }
        },
        del (idx) {
            this.scene.entities.splice(idx, 1)
        },
        addScene () {
            let newId = this.scenes[this.scenes.length - 1] ? (+this.scenes[this.scenes.length - 1].id + 1) : this.scenes.length;
            this.scenes = [...this.scenes, {
                name: 'Scene ' + newId,
                id: newId,
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
            this.$forceUpdate()
        },
        zoom (posZ) {
            console.log({posZ})
            return 25*posZ//posZ
        },
        close (en) {
            en.params = false
            this.$forceUpdate()
        },
        params (type, idx) {
            console.log('click', idx)
            if (this.mode == 1) {
                if (type == 'web') {
                    this.modal = true
                    if (this.scene.entities[idx] && this.scene.entities[idx].attributes && this.scene.entities[idx].attributes.url) {
                        this.url = this.scene.entities[idx].attributes.url
                    } else {
                        this.url = null
                    }
                } else {
                    if (this.scene.entities[idx] && this.scene.entities[idx].goto > 0) {
                        for (let i=0;i<this.scenes.length;i++) {
                            if (+this.scenes[i].id == +this.scene.entities[idx].goto) {
                                // this.gotoScene(this.scene.entities[idx].goto)
                                this.gotoScene(i)
                                break;
                            }
                        }
                    }
                }
            } else {
                this.rightWeb = this.rightArrow = false
                this.idx = idx;
                for(let i=0;i<this.scene.entities.length;i++) {
                    console.log(i, i == idx)
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
                this.scene.entities.push({lookAt: '[camera]', type, coordinates: {x: pos.x, y: pos.y, z: pos.z}, rotation: {x: rot.x, y: rot.y, z: rot.z}})
            } else if (type === 'arrow') {
                this.scene.entities.push({lookAt: '[camera]', type, coordinates: {x: pos.x, y: pos.y, z: pos.z}, rotation: {x: rot.x, y: rot.y, z: rot.z}})
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
            this.isUpload = true
            let res = await this.uploadPhoto({ photo_file: file, photo_name: 'home' }).catch(e => this.isUpload = false)
            console.log(res)
            if (res.photo_uri) {
                this.sary = `${this.$axios.defaults.baseURL}/uploads/photos/img/${res.photo_uri}`
                this.scene.attributes.img = this.sary
            } else {
            }
            this.isUpload = false
        },
        showModal(title, content) {
            this.modalTitle = title || 'Alert'
            this.modalContent = content || "Une erreur s'est produite"
            this.$refs['my-modal'].show()
        },
        hideModal() {
            this.$refs['my-modal'].hide()
        }
    }
});
    