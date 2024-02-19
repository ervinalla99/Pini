import * as OBC from "openbim-components";
import * as THREE from "three";

const viewer = new OBC.Components();
viewer.onInitialized.add(() => {});
let scene;
const sceneComponent = new OBC.SimpleScene(viewer);
sceneComponent.setup();
viewer.scene = sceneComponent;
scene = sceneComponent.get();
scene.background = new THREE.Color("white")
const viewerContainer = document.getElementById(
  "webinar-sharepoint-viewer"
) as HTMLDivElement;
const rendererComponent = new OBC.PostproductionRenderer(
  viewer,
  viewerContainer
);
viewer.renderer = rendererComponent;
const postproduction = rendererComponent.postproduction;

// Set navigation mode to orbit

const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer);
cameraComponent.setNavigationMode("Orbit");
const camera = cameraComponent.get(); // Retrieve the active camera
if (camera instanceof THREE.PerspectiveCamera) {
    // For Perspective Camera, adjust the far clipping plane
    camera.far = 100000; // Adjust the value as needed to allow zooming in on distant objects
} else if (camera instanceof THREE.OrthographicCamera) {
    // For Orthographic Camera, adjust the zoom
    camera.far = 100000; // Adjust the value as needed
}

viewer.camera = cameraComponent;

const raycasterComponent = new OBC.SimpleRaycaster(viewer);
viewer.raycaster = raycasterComponent;

viewer.init();
postproduction.enabled = true;

//const grid = new OBC.SimpleGrid(viewer, new THREE.Color(0x666666));
//postproduction.customEffects.excludedMeshes.push(grid.get());

const ifcLoader = new OBC.FragmentIfcLoader(viewer);

ifcLoader.settings.wasm = {
  absolute: true,
  path: "https://unpkg.com/web-ifc@0.0.44/",
};

const highlighter = new OBC.FragmentHighlighter(viewer);
highlighter.setup();

const propertiesProcessor = new OBC.IfcPropertiesProcessor(viewer);
highlighter.events.select.onClear.add(() => {
  propertiesProcessor.cleanPropertiesList();
});

ifcLoader.onIfcLoaded.add(async (model) => {
  console.log("Model loaded:", model);
console.log(model.properties);
  propertiesProcessor.process(model);
  highlighter.events.select.onHighlight.add((selection) => {
      const fragmentID = Object.keys(selection)[0];
      const expressID = Number([...selection[fragmentID]][0]);
      propertiesProcessor.renderProperties(model, expressID);
  });

  highlighter.update();
 
  onPropertiesLoaded(model)
  viewerContainer.ondblclick = () => clipper.create();
});

import { FragmentsGroup } from "bim-fragment"

async function onPropertiesLoaded(model: FragmentsGroup){
  //create properties for property window
  try{
      
     
     classifier.byIfcRel(model,160246688, "Aggregates")
     classifier.byStorey(model)
     classifier.get()
   // const data = classifier.get()
     //console.log(data);
      const tree = await createModelTree()
      await classificationWindow.slots.content.dispose(true)
      classificationWindow.addChild(tree)

      
     
  } catch (error){
      alert(error)
  }
}
async function createModelTree(){
  const fragmentTree = new OBC.FragmentTree(viewer)
  await fragmentTree.init()
  
  await fragmentTree.update([ "Aggregates", "storeys"]) 
  fragmentTree.onHovered.add((fragmentMap) =>{
      highlighter.highlightByID("hover", fragmentMap)
  })
  fragmentTree.onSelected.add((fragmentMap)=>{
      highlighter.highlightByID("select", fragmentMap)
  })
  const tree = fragmentTree.get().uiElement.get("tree")
  return tree
}
const classifier = new OBC.FragmentClassifier(viewer)
const classificationWindow = new OBC.FloatingWindow(viewer)
viewer.ui.add(classificationWindow)
classificationWindow.title ="Model Groups"

const classificationBtn = new OBC.Button(viewer)
classificationBtn.materialIcon = "account_tree"
classificationBtn.onClick.add(()=>{
  classificationWindow.visible = !classificationWindow.visible
  classificationBtn.active = classificationWindow.visible
})

const mainToolbar = new OBC.Toolbar(viewer);
mainToolbar.addChild(
  ifcLoader.uiElement.get("main"),
  propertiesProcessor.uiElement.get("main"),
  classificationBtn
);    
viewer.ui.addToolbar(mainToolbar);

// Variable to store the last highlighted fragment's ID map
let lastHighlightedFragmentIdMap: { [fragmentId: string]: any } = {};
function zoomIn() {
  const currentCamera = cameraComponent.activeCamera;
  if (currentCamera instanceof THREE.PerspectiveCamera) {
      // For Perspective Camera, modify FOV or position
      currentCamera.fov /= 2; // Decreasing the FOV will create a zoom-in effect
      currentCamera.updateProjectionMatrix();
  } else if (currentCamera instanceof THREE.OrthographicCamera) {
      // For Orthographic Camera, adjust the zoom
      currentCamera.zoom *= 10;
      currentCamera.updateProjectionMatrix();
  }
}
function zoomOut() {
  const currentCamera = cameraComponent.activeCamera;
  if (currentCamera instanceof THREE.PerspectiveCamera) {
    // For Perspective Camera, modify FOV or position
    currentCamera.fov *= 2; // Increasing the FOV will create a zoom-out effect
    currentCamera.updateProjectionMatrix();
  } else if (currentCamera instanceof THREE.OrthographicCamera) {
    // For Orthographic Camera, adjust the zoom
    currentCamera.zoom /= 10;
    currentCamera.updateProjectionMatrix();
  }
}

// Modify the event handler function for the "keydown" event
function handleZoomOutKeyPress(event:any) {
  // Check if the pressed key is "a"
  if (event.key === 'a') {
    // Prevent default behavior
    event.preventDefault();

    // Call the zoomOut function
    zoomOut();
  }
}
function handleZoomInKeyPress(event:any) {
  // Check if the pressed key is "z"
  if (event.key === 'z') {
    // Prevent default behavior
    event.preventDefault();

    // Call the zoomIn function
    zoomIn();
  }
}
document.addEventListener('keydown', handleZoomOutKeyPress);
document.addEventListener('keydown', handleZoomInKeyPress);

// Function to set navigation mode
function setNavigationMode(navMode: 'Orbit' | 'FirstPerson' | 'Plan') {
  cameraComponent.setNavigationMode(navMode);
}

// Add event listener for the navigation mode buttons
document.addEventListener('DOMContentLoaded', () => {
  const orbitButton = document.getElementById('orbitButton');
  const firstPersonButton = document.getElementById('firstPersonButton');
  const planButton = document.getElementById('planButton');
  
  if (orbitButton && firstPersonButton && planButton) {
      orbitButton.addEventListener('click', () => setNavigationMode('Orbit'));
      firstPersonButton.addEventListener('click', () => setNavigationMode('FirstPerson'));
      planButton.addEventListener('click', () => setNavigationMode('Plan'));
  } else {
      console.error('One or more navigation mode buttons not found.');
  }
});
cameraComponent.activeCamera.near = 0.1; // Closer objects than 0.1 units won't be visible
cameraComponent.activeCamera.far = 100000; // Objects further than 10000 units won't be visible
cameraComponent.activeCamera.updateProjectionMatrix();

// Function to toggle the visibility of a selected fragment
async function toggleFragmentVisibility() {
    if (Object.keys(lastHighlightedFragmentIdMap).length === 0) {
        console.log("No fragment selected to toggle visibility.");
        return;
    }

    // Get FragmentHider instance
    const hider = await viewer.tools.get(OBC.FragmentHider);

    // Determine the current visibility state and toggle it
    const fragmentId = Object.keys(lastHighlightedFragmentIdMap)[0];
    const isVisible = lastHighlightedFragmentIdMap[fragmentId].isVisible;
    lastHighlightedFragmentIdMap[fragmentId].isVisible = !isVisible;

    // Apply the visibility change
    hider.set(!isVisible, lastHighlightedFragmentIdMap);
    const fragmentElement = document.getElementById(fragmentId);
    if (fragmentElement) {
        fragmentElement.classList.remove('highlight');
    }
    highlighter.clear();
}

// Event handler for when a fragment is highlighted
highlighter.events.select.onHighlight.add((selection) => {
    // Assuming 'selection' is the FragmentIdMap returned by the highlight method
    lastHighlightedFragmentIdMap = selection;
    // Adding visibility state to the FragmentIdMap
    for (const fragmentId in lastHighlightedFragmentIdMap) {
        lastHighlightedFragmentIdMap[fragmentId].isVisible = true; // Assuming initial state is visible
    }
});
document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggleButton');
  if (toggleButton) {
      toggleButton.addEventListener('click', toggleFragmentVisibility);
  } else {
      console.error('Button with ID "toggleButton" not found.');
  }

  // Add event listener for keydown events
  document.addEventListener('keydown', handleKeyDown);
});

// Function to handle keydown events
function handleKeyDown(event: KeyboardEvent) {
  // Check if the pressed key is "H"
  if (event.key === "h" || event.key === "H") {
      // Trigger the click event of the toggleButton
      const toggleButton = document.getElementById('toggleButton');
      if (toggleButton) {
          toggleButton.click();
      }
  }
}
async function showAllHiddenFragments() {
  // Get FragmentHider instance

  // Retrieve the FragmentManager
  const fragmentManager = await viewer.tools.get(OBC.FragmentManager);

  // Retrieve all fragments from the FragmentManager
  const allFragments = fragmentManager.list;
  // Iterate over each fragment
  for (const fragmentId in allFragments) {
      // Check if the fragment is hidden

  // Show the fragment if it's hidden
      const fragment = allFragments[fragmentId];
      // If the fragment has a method to toggle visibility, use it
      if (fragment.setVisibility) {
          fragment.setVisibility(true);
      }
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggleButton');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleFragmentVisibility);
    } else {
        console.error('Button with ID "toggleButton" not found.');
    }

    // Button to show all hidden fragments
    const showAllButton = document.getElementById('showAllButton');
    if (showAllButton) {
        showAllButton.addEventListener('click', showAllHiddenFragments);
    } else {
        console.error('Button with ID "showAllButton" not found.');
    }
});

// Function to isolate the selected fragment
async function isolateFragment() {
    // Retrieve the FragmentManager
    const fragmentManager = await viewer.tools.get(OBC.FragmentManager);

    // Retrieve all fragments from the FragmentManager
    const allFragments = fragmentManager.list;

    // Hide all fragments
    for (const fragmentId in allFragments) {
        const fragment = allFragments[fragmentId];
        if (fragment.setVisibility) {
            await fragment.setVisibility(false);  // Assuming setVisibility is async
        }
    }

    // Simulate two clicks on the toggle button to show the selected fragment
    const toggleButton = document.getElementById('toggleButton');
    if (toggleButton) {
        // First click - toggles the visibility of the selected fragment
        toggleButton.click();
        // Wait for the DOM to update
        await new Promise(resolve => setTimeout(resolve, 0));
        // Second click - sets the fragment back to its original state
        toggleButton.click();
    } else {
        console.error('Button with ID "toggleButton" not found.');
    }
}



// Add event listener for the isolate button
document.addEventListener('DOMContentLoaded', () => {
  const isolateButton = document.getElementById('isolateButton');
  if (isolateButton) {
      isolateButton.addEventListener('click', () => {
          isolateFragment();
      });

      // Add keydown event listener
      document.addEventListener('keydown', (event) => {
          // Convert the pressed key to lowercase for comparison
          const keyPressed = event.key.toLowerCase();
          // Check if the pressed key is "i"
          if (keyPressed === 'i') {
              // Trigger click event on isolate button
              isolateButton.click();
          }
      });
  } else {
      console.error('Button with ID "isolateButton" not found.');
  }
});

window.addEventListener("thatOpen", async (event: any) => {
  const { name, payload } = event.detail;
  if (name === "openModel") {
    const { name, buffer } = payload;
    const model = await ifcLoader.load(buffer, name);
    const scene = viewer.scene.get();
    scene.add(model);
  }
});

// Create the buttons


const toggleButton = new OBC.Button(viewer, {
  tooltip: "Toggle visibility",
});

const showAllButton = new OBC.Button(viewer, {
  tooltip: "Show all hidden fragments",
});

const isolateButton = new OBC.Button(viewer, {
  tooltip: "Isolate fragments",
});
// Set the text content of the buttons
toggleButton.domElement.textContent = "Hide";
showAllButton.domElement.textContent = "Show All";
isolateButton.domElement.textContent = "Isolate";
// Add the buttons to the mainToolbar
mainToolbar.addChild(toggleButton, showAllButton, isolateButton);

// Add the mainToolbar to the viewer's UI
viewer.ui.addToolbar(mainToolbar);
toggleButton.onClick.add(toggleFragmentVisibility);
showAllButton.onClick.add(showAllHiddenFragments);
isolateButton.onClick.add(isolateFragment);
// main.ts

const dimensions = new OBC.LengthMeasurement(viewer);
dimensions.enabled = true;
dimensions.snapDistance = 1;
viewerContainer.ondblclick = () => dimensions.create();
window.onkeydown = (event) => {
  if (event.code === 'Delete') {
      dimensions.delete();
  } else if (event.code === 'Backspace') {
      clipper.delete();
  }
};
  mainToolbar.addChild(dimensions.uiElement.get("main")); 
  const clipper = new OBC.EdgesClipper(viewer);
  clipper.enabled = true;
  const meshes = viewer.meshes
  const shapeFill = new THREE.MeshBasicMaterial({color: 'lightgray', side: 2});
  const shapeLine = new THREE.LineBasicMaterial({ color: 'black' });
  const shapeOutline = new THREE.MeshBasicMaterial({color: 'black', opacity: 0.2, side: 2, transparent: true});
clipper.styles.create('White shape, black lines', new Set(meshes), shapeLine, shapeFill, shapeOutline);

