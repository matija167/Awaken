import './style.scss';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { pass } from 'three/tsl';
import gsap from "gsap";

const canvas = document.querySelector("#experience-canvas");
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

const zAxisFans = [];
const yAxisFans = [];
const xAxisFans = [];
const raycasterObjects = [];
let currentIntersects = [];

const socialLinks = {
    "Steam": "https://steamcommunity.com/id/2201763",
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Scene and Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(14.5, 13, 11.5);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);
controls.update();

// Loaders
const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Environment Map
const environmentMap = new THREE.CubeTextureLoader()
    .setPath('textures/skybox/')
    .load(['px.webp', 'nx.webp', 'py.webp', 'ny.webp', 'pz.webp', 'nz.webp']);

// Texture Map
const textureMap = {
    First: { day: "/textures/Texture_Set_One.webp", night: "" },
    Second: { day: "/textures/Texture_Set_Two.webp", night: "" },
    Third: { day: "/textures/Texture_Set_Three.webp", night: "" },
    Fourth: { day: "/textures/Texture_Set_Four.webp", night: "" },
};

const loadedTextures = { day: {}, night: {} };

// Load Textures
Object.entries(textureMap).forEach(([key, paths]) => {
    const dayTexture = textureLoader.load(paths.day);
    dayTexture.flipY = false;
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTextures.day[key] = dayTexture;

    if (paths.night) {
        const nightTexture = textureLoader.load(paths.night);
        nightTexture.flipY = false;
        nightTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTextures.night[key] = nightTexture;
    }
});

// Materials
const glassMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    opacity: 1,
    metalness: 0,
    roughness: 0,
    ior: 1.5,
    thickness: 0.01,
    specularIntensity: 1,
    envMap: environmentMap,
    envMapIntensity: 1,
    depthWrite: false,
});

const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

const videoElement = document.createElement("video");
videoElement.src = "/textures/video/Screen.mp4";
videoElement.loop = true;
videoElement.muted = true;
videoElement.playsInline = true;
videoElement.autoplay = true;
videoElement.play();

const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.colorSpace = THREE.SRGBColorSpace;
videoTexture.flipY = false;

// Mouse Movement
window.addEventListener("mousemove", (e) => {
    pointer.x = (e.clientX / sizes.width) * 2 - 1;
    pointer.y = -(e.clientY / sizes.height) * 2 + 1;
});

window.addEventListener("touchstart", (e) => {
    e.preventDefault();
    pointer.x = (e.touches[0].clientX / sizes.width) * 2 - 1;
    pointer.y = -(e.touches[0].clientY / sizes.height) * 2 + 1;
}, 
{passive: false}
);

window.addEventListener("touchend", (e) => {
    e.preventDefault();
    handleRaycasterInteraction();
}, 
{passive: false}
);

function handleRaycasterInteraction() {
    if (currentIntersects.length > 0) {
        const object = currentIntersects[0].object;

        Object.entries(socialLinks).forEach(([key, url]) => {
            if (object.name.includes(key)) {
                const newWindow = window.open();
                newWindow.opener = null;
                newWindow.location = url;
                newWindow.target = "_blank";
                newWindow.rel = "noopener noreferrer";
            }
        });
    }
};

window.addEventListener("click", handleRaycasterInteraction);

// Load Model
loader.load("/models/Room_Portfolio.glb", (glb) => {
    glb.scene.traverse((child) => {
        if (child.isMesh) {
            if (child.name.includes("Water")) {
                child.material = new THREE.MeshPhysicalMaterial({
                    color: 0x558BC8,
                    transparent: true,
                    opacity: 0.66,
                    depthWrite: false,
                });
            } else if (child.name.includes("Glass")) {
                child.material = glassMaterial;
            } else if (child.name.includes("Bubble")) {
                child.material = whiteMaterial;
            } else if (child.name.includes("Screen")) {
                child.material = new THREE.MeshBasicMaterial({
                    map: videoTexture,
                });
            } else {
                Object.keys(textureMap).forEach((key) => {
                    if (child.name.includes(key)) {
                        const material = new THREE.MeshBasicMaterial({
                            map: loadedTextures.day[key],
                        });
                        child.material = material;

                        // Add fans to appropriate arrays based on their names
                        if (child.name.includes("Cooler")) {
                            if (
                                child.name.includes("Cooler1") ||
                                child.name.includes("Cooler2") ||
                                child.name.includes("Cooler7") ||
                                child.name.includes("Cooler8") ||
                                child.name.includes("Cooler9")
                            ) {
                                zAxisFans.push(child);
                            } else if (
                                child.name.includes("Cooler6") ||
                                child.name.includes("Cooler5") ||
                                child.name.includes("Cooler4")
                            ) {
                                zAxisFans.push(child);
                            } else if (child.name.includes("Cooler3")) {
                                xAxisFans.push(child);
                            }
                        }

                        // Optimize texture filtering
                        if (child.material.map) {
                            child.material.map.minFilter = THREE.LinearFilter;
                        }
                    }
                });
            }

            // Add to raycaster objects
            if (child.name.includes("Raycaster")) {
                raycasterObjects.push(child);
            }
        }
    });
    scene.add(glb.scene);
});

// Event Listeners
window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update Camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update Renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Render Loop
const render = () => {
    controls.update();

    // Animate Fans
    zAxisFans.forEach((fan) => {
        fan.rotation.z += 0.1;
    });
    yAxisFans.forEach((fan) => {
        fan.rotation.y += 0.1;
    });
    xAxisFans.forEach((fan) => {
        fan.rotation.x += 0.1;
    });

    // Raycaster
    raycaster.setFromCamera(pointer, camera);
    currentIntersects = raycaster.intersectObjects(raycasterObjects);

    if (currentIntersects.length > 0) {
        document.body.style.cursor = "pointer";
    } else {
        document.body.style.cursor = "default";
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
};

render();