import React from 'react'
import ReactImageAnnotate from "react-image-annotate"
import "../App.css"
require('dotenv').config(process.env.NODE_ENV === "development" ? "../../.env.development" : "../../.env.production")

class ImageLabelingPage extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            imageUrl: this.props.location.state.imageUrl,
            requestId: this.props.location.state.requestId,
            boundingBoxes: [],
            ready: false
        }

        this.apiHostname = process.env.REACT_APP_API_HOSTNAME
    }

    componentDidMount() {
        this.getBoundingBoxes()
    }

    getBoundingBoxes() {
        let imageBoundingsBoxes = []
        fetch(this.apiHostname + "/storedRequests/getBoundingBoxes?rid=" + this.state.requestId, { mode: "cors" })
            .then(results => {
                return results.json()
            })
            .then(fetchedBoundingBoxes => {
                for (let i in fetchedBoundingBoxes) {
                    let currResponse = fetchedBoundingBoxes[i]
                    const randColor = Math.random() * 360
                    let boundingBox = {
                        cls: "CHEM_EQUATION_NO_EQU",
                        color: `hsl(${randColor},100%,50%)`,
                        w: currResponse.width / 450,
                        x: currResponse.originX / 450,
                        h: currResponse.height / 700,
                        y: currResponse.originY / 700,
                        id: currResponse.id,
                        tags: currResponse.tags,
                        type: "box",
                        editingLabels: false,
                        highlighted: false,
                    }
                    imageBoundingsBoxes.push(boundingBox)
                }
                this.setState({ boundingBoxes: imageBoundingsBoxes, ready: true })
            })
            .catch(err => {
                console.log(err)
            })

    }

    redirect(path) {
        const { history } = this.props;
        history.push(path)
    }

    comparer(otherArray) {
        return function (current) {
            return otherArray.filter(function (other) {
                return other.id === current.id
            }).length === 0;
        }
    }

    onExitClick(images) {
        console.log(this.state.boundingBoxes)
        if (images && images[0].regions) {
            let boundingBoxes = []
            for (let i in images[0].regions) {
                const region = images[0].regions[i]
                const boundingBox = {
                    id: region.id,
                    requestInfoId: images[0].name,
                    originX: 450 * region.x,
                    width: 450 * region.w,
                    originY: 700 * region.y,
                    height: 700 * region.h,
                    tags: region.tags ? region.tags : []
                }
                boundingBoxes.push(boundingBox)
            }

            const config = {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ modified: boundingBoxes, deleted: this.state.boundingBoxes.filter(this.comparer(boundingBoxes)) })
            }
            console.log({ original: this.state.boundingBoxes })
            console.log({ modified: boundingBoxes, deleted: this.state.boundingBoxes.filter(this.comparer(boundingBoxes)) })

            fetch(this.apiHostname + "/storedRequests/updateBoundingBoxes", config)
                .then(results => {
                    return results.json()
                })
                .then(response => {
                    if (response["status"] === "success") {
                        this.redirect("/view?rid=" + images[0].name)
                    } else {
                        alert("Error: " + response["description"])
                    }
                })
                .catch(err => {
                })
        } else {
            this.redirect("/view?rid=" + images[0].name)
        }
    }

    render() {

        return !this.state.ready ? <div></div> : (
            <ReactImageAnnotate
                selectedImage={this.state.imageUrl}
                taskDescription="# Draw region around each chemical equation"
                images={[{ src: this.state.imageUrl, name: this.state.requestId, regions: this.state.boundingBoxes }]}
                regionTagList={["HAND_WRITTEN", "COMPUTER_SCREEN", "DIR_BLUR", "LOW_RES", "OBFUSCATED", "LOW_LIGHT", "HIGH_LIGHT", "OFF_FOCUS"]}
                regionClsList={["CHEM_EQUATION_NO_EQU", "CHEM_EQUATION_EQU"]}
                pointDistancePrecision={2}
                enabledTools={["select", "create-box",]}
                onExit={(state) => this.onExitClick(state.images.map((image) => ({ name: image.name, regions: image.regions })))}
            />
        );
    }
}

export default ImageLabelingPage