import * as OBC from "openbim-components";
import * as THREE from "three";

const viewer = new OBC.Components();
viewer.onInitialized.add(() => {});
let scene;
const sceneComponent = new OBC.SimpleScene(viewer);
sceneComponent.setup();
viewer.scene = sceneComponent;
scene = sceneComponent.get();
scene.background = new THREE.Color("#202932");
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
  function clearPropertiesList() {
    const propertiesListElement = document.getElementById('PropertiesList'); // Replace with the correct ID or selector
    if (propertiesListElement) {
      propertiesListElement.innerHTML = ''; // Clear the content
    }
  }
  clearPropertiesList()
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
  const culler = new OBC.ScreenCuller(viewer);
viewerContainer.addEventListener("mouseup", () => culler.needsUpdate = true);
viewerContainer.addEventListener("wheel", () => culler.needsUpdate = true);
for(const fragment of model.items) {
culler.add(fragment.mesh);
}
culler.needsUpdate = true;

});

import { FragmentsGroup } from "bim-fragment"

async function onPropertiesLoaded(model: FragmentsGroup){
  //create properties for property window
  try{
     classifier.byModel(model.name, model)
     classifier.byStorey(model)
     classifier.byEntity(model)
     //classifier.byIfcRel(model,4097777520,"Site")
     classifier.byIfcRel(model,3242617779,"Storeys")
     classifier.byIfcRel(model,160246688,"aggregates")
     classifier.byIfcRel(model,781010003,"Element Type")

     //classifier.byIfcRel(model,2655215786,"Material")
     classifier.get()
   // const data = classifier.get()
     //console.log(data);
      const tree = await createModelTree()
      await classificationWindow.slots.content.dispose(true)
      classificationWindow.addChild(tree)
      await styler.setup();
      await styler.update();
  } catch (error){
      alert(error)
  }
}

async function createModelTree(){
  const fragmentTree = new OBC.FragmentTree(viewer)
  await fragmentTree.init()
  const categories = [
    "model" ,
    "Storeys",  
    "entities",
    "Element Type",  
];
  await fragmentTree.update(categories);

  fragmentTree.onHovered.add((filter) =>{
      highlighter.highlightByID("hover", filter)
  })
  fragmentTree.onSelected.add((filter)=>{
      highlighter.highlightByID("select", filter,true, true)
  })
  const tree = fragmentTree.get().uiElement.get("tree")
  return tree
}
const classifier = new OBC.FragmentClassifier(viewer)
const classificationWindow = new OBC.FloatingWindow(viewer)
viewer.ui.add(classificationWindow)
classificationWindow.title = "Model Groups";
classificationWindow.domElement.style.position = "absolute";
classificationWindow.domElement.style.left = "0px"; // Set the left position to 0px
classificationWindow.domElement.style.top = "0px"; // Set the top position to 0px
classificationWindow.domElement.style.width = "16%"; // Set the width to % of the viewport width
classificationWindow.domElement.style.height = "38vh"; // Set the height to % of the viewport height

  // Simulate a click on the property button
  const propertyButton = propertiesProcessor.uiElement.get("main").domElement;
  propertyButton.click();
const propertiesWindowDOMElement = propertiesProcessor.uiElement.get("propertiesWindow").domElement;
propertiesWindowDOMElement.style.position = "absolute";
propertiesWindowDOMElement.style.left = "0px"; // Set the left position to 
propertiesWindowDOMElement.style.top = "38vh"; // Set the top position to 
propertiesWindowDOMElement.style.height = "62vh"
propertiesWindowDOMElement.style.width = "16%"

//const classificationBtn = new OBC.Button(viewer)
//classificationBtn.materialIcon = "account_tree"
//classificationBtn.onClick.add(()=>{
  //classificationWindow.visible = !classificationWindow.visible
  //classificationBtn.active = classificationWindow.visible
//})
// propertiesProcessor.uiElement.get("main"),
// classificationBtn                           if buttons are needed inside the toolbar

// Create the help window
const help = new OBC.FloatingWindow(viewer);
help.title = "Help";
help.visible = false; // Set initial visibility to false
const helpDOMElement = help.domElement;
// Set CSS styles to position the help window in the middle
helpDOMElement.style.position = "absolute";
helpDOMElement.style.left = "50%";
helpDOMElement.style.top = "50%";
helpDOMElement.style.transform = "translate(-50%, -50%)"; // Center the window
helpDOMElement.style.width = "55%";
helpDOMElement.style.height = "65%";
// Create a div element to contain the help text
const helpText = document.createElement('div');
helpText.innerHTML = `
<div style="margin-left: 20px;"> <!-- Add margin to the left side -->
    <p>Welcome to PINI IFC Viewer v1.0!</p>
    
    <p><strong style="text-decoration: underline;">Overview:</strong></p>
    <p>The PINI IFC Viewer is a web-based application designed for viewing IFC (Industry Foundation Classes) models in 3D. It leverages modern OpenBim web technologies and libraries to provide a user-friendly interface for visualizing and interacting with complex architectural and engineering models.</p>
    
    <p><strong style="text-decoration: underline;">Loading IFC model:</strong></p>
    <ul>
        <li>Click the IFC Loader button to open the source of your IFC model.</li>
        <li>The application uses the WebIFC library for parsing and loading IFC files.</li>
    </ul>
    
    <p><strong style="text-decoration: underline;">Navigation:</strong></p>
    <ul>
        <li>Use the mouse to orbit around the model.</li>
        <li>Press '1' to zoom in and '2' to zoom out.</li>
    </ul>
    
    <p><strong style="text-decoration: underline;">Visibility:</strong></p>
    <ul>
        <li>Select a fragment by clicking on it to toggle its visibility.</li>
        <li>Click "Hide" or Press 'H' to toggle visibility of the selected fragment.</li>
    </ul>
    
    <p><strong style="text-decoration: underline;">Isolation:</strong></p>
    <ul>
        <li>Click 'Isolate' or press 'Shift' to hide all fragments except the selected one.</li>
    </ul>
    
    <p><strong style="text-decoration: underline;">Measurements:</strong></p>
    <ul>
        <li>Click on the Measurement button to measure the length between two points on the model.</li>
        <li>Place the mouse cursor over the dimension line and Press 'Delete' to delete a measurement.</li>
        <li>Press 'Esc' to exit the function.</li>
    </ul>
    
    <p><strong style="text-decoration: underline;">Clipping:</strong></p>
    <ul>
        <li>Create a clipping plane by double clicking over the desired face. The clipping plane is created orthogonally to the chosen face.</li>
        <li>Select and press 'Backspace' to delete a clipping plane, or click "Reset" to delete all.</li>
    </ul>
    <p><strong style="text-decoration: underline;">Clipping Styles:</strong></p>
    <ul>
        <li>Click the Clipping Styles button to edit the desired section plan style.</li>
        <li>You can edit the fill color and thickness of the lines in the clipping plane. Make sure the element categories</li>
        <li> of the IFC model are added to the "Categories" list. Example: "IFCBUILDINGELEMENTPROXY", "IFCBEAM", etc.	</li>
    <p><strong style="text-decoration: underline;">Reset:</strong></p>
    <ul>
        <li>Click 'Reset' to reset the model visibility, dimensions, and clippings.</li>
    </ul>
    
    <p><strong style="text-decoration: underline;">Libraries Used:</strong></p>
    <p>The application utilizes open-source libraries such as OpenBIM Components and Three.js for rendering and interacting with 3D models in the browser.</p>
    
    <p><strong style="text-decoration: underline;">Running the App:</strong></p>
    <p>The app runs directly in a web browser, eliminating the need for additional software installations. Simply open the app in a compatible web browser, load your IFC model, and start exploring!</p>
    <p><strong style="text-decoration: underline;">GitHub Repository:</strong></p>
    <p>For more details on how the app is constructed and to access the source code, please visit the GitHub repository link: <a href="https://github.com/ervinalla99/pini" target="_blank" style="text-decoration: underline;">https://github.com/ervinalla99/pini</a>.</p>
    <p><strong style="text-decoration: underline;">Documentation:</strong></p>
    <p>If you to learn more about this App's documentation, please visit the link: <a href="https://people.thatopen.com/c/documentation/" target="_blank" style="text-decoration: underline;">https://people.thatopen.com/c/documentation/</a>.</p>
    
</div>
`;
// Append the help text to the help window DOM element
helpDOMElement.appendChild(helpText);
// Add the help window to the viewer
viewer.ui.add(help);

// Create the HelpButton
const HelpButton = new OBC.Button(viewer, {
  tooltip: "Help",
  materialIconName: "help", // Icon name from Google Icons
});
HelpButton.onClick.add(() => {
    help.visible = !help.visible;
    help.active = help.visible;
});
const ifcLoaderToolbar = new OBC.Toolbar(viewer);
ifcLoaderToolbar.addChild(ifcLoader.uiElement.get("main"));
const mainToolbar = new OBC.Toolbar(viewer);
viewer.ui.addToolbar(ifcLoaderToolbar);
const visibilityToolbar = new OBC.Toolbar(viewer);
viewer.ui.addToolbar(visibilityToolbar);  
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
  if (event.key === '2') {
    // Prevent default behavior
    event.preventDefault();

    // Call the zoomOut function
    zoomOut();
  }
}
function handleZoomInKeyPress(event:any) {
  // Check if the pressed key is "z"
  if (event.key === '1') {
    // Prevent default behavior
    event.preventDefault();

    // Call the zoomIn function
    zoomIn();
  }
}
document.addEventListener('keydown', handleZoomOutKeyPress);
document.addEventListener('keydown', handleZoomInKeyPress);

// Function to set navigation mode
//function setNavigationMode(navMode: 'Orbit' | 'FirstPerson' | 'Plan') {
//  cameraComponent.setNavigationMode(navMode);
//}

// Add event listener for the navigation mode buttons
//document.addEventListener('DOMContentLoaded', () => {
//  const orbitButton = document.getElementById('orbitButton');
//  const firstPersonButton = document.getElementById('firstPersonButton');
//  const planButton = document.getElementById('planButton');
  
//  if (orbitButton && firstPersonButton && planButton) {
//      orbitButton.addEventListener('click', () => setNavigationMode('Orbit'));
//      firstPersonButton.addEventListener('click', () => setNavigationMode('FirstPerson'));
//      planButton.addEventListener('click', () => setNavigationMode('Plan'));
//  } else {
     // console.error('One or more navigation mode buttons not found.');
//  }
//});
//cameraComponent.activeCamera.near = 0.1; // Closer objects than 0.1 units won't be visible
//cameraComponent.activeCamera.far = 100000; // Objects further than 10000 units won't be visible
//cameraComponent.activeCamera.updateProjectionMatrix();

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

// document.addEventListener('DOMContentLoaded', () => {
  //   const toggleButton = document.getElementById('toggleButton');
  //   if (toggleButton) {
      //   toggleButton.addEventListener('click', toggleFragmentVisibility);
  //   } else {
      //   console.error('Button with ID "toggleButton" not found.');
   //  }

    // Button to show all hidden fragments
   // const showAllButton = document.getElementById('showAllButton');
   //  if (showAllButton) {
     //    showAllButton.addEventListener('click', showAllHiddenFragments);
   //  } else {
   //      console.error('Button with ID "showAllButton" not found.');
   //  }
// });

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
          //const keyPressed = event.key.toLowerCase();
          // Check if the pressed key is "i"
          if (event.key === 'Shift') {
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
  tooltip: "Hide the selected fragment (or Press 'H')",
  materialIconName: "visibility_off", // Icon name from Google Icons
});

// const showAllButton = new OBC.Button(viewer, {
  // tooltip: "Show all hidden fragments",
// });

const isolateButton = new OBC.Button(viewer, {
  tooltip: "Isolate (or Press 'Shift')",
  materialIconName: "filter_center_focus",
});
// Set the text content of the buttons
//toggleButton.domElement.textContent = "Hide";
//toggleButton.domElement.title = "or Press H";
// showAllButton.domElement.textContent = "Show All";
//isolateButton.domElement.textContent = "Isolate";
//isolateButton.domElement.title = "or Press I";
// Add the buttons to the mainToolbar
//mainToolbar.addChild(toggleButton, isolateButton);

// Add the mainToolbar to the viewer's UI
toggleButton.onClick.add(toggleFragmentVisibility);
// showAllButton.onClick.add(showAllHiddenFragments);
isolateButton.onClick.add(isolateFragment);
// main.ts

const dimensions = new OBC.LengthMeasurement(viewer);
dimensions.enabled = true;
dimensions.snapDistance = 0;
viewerContainer.ondblclick = () => dimensions.create();
window.onkeydown = (event) => {
  if (event.code === 'Delete') {
      dimensions.delete();
  } else if (event.code === 'Backspace') {
      clipper.delete();
  }
};
 
  const clipper = new OBC.EdgesClipper(viewer);
  clipper.enabled = true;
  const meshes = viewer.meshes
  const shapeFill = new THREE.MeshBasicMaterial({color: 'lightgray', side: 2});
  const shapeLine = new THREE.LineBasicMaterial({ color: 'black' });
  const shapeOutline = new THREE.MeshBasicMaterial({color: 'black', opacity: 0.2, side: 2, transparent: true});
clipper.styles.create('White shape, black lines', new Set(meshes), shapeLine, shapeFill, shapeOutline);
// Set the opacity of the clipper plane material to 0
//clipper.styles.update('White shape, black lines', { opacity: 0 });

// Create the button
const resetButton = new OBC.Button(viewer, {
  tooltip: "Reset",
  materialIconName: "autorenew",
});
const SectionButton = new OBC.Button(viewer, {
  tooltip: "To create a section plan double click over the face of a fragment.",
});
SectionButton.domElement.title = "Double click over the face of a fragment.";
SectionButton.domElement.textContent = "Section Plan";
const sectionWindow = new OBC.FloatingWindow(viewer);
sectionWindow.title = "How to";
sectionWindow.visible = false; // Set initial visibility to false
const sectionWindowDOMElement = sectionWindow.domElement;
// Set CSS styles to position the help window in the middle
sectionWindowDOMElement.style.position = "absolute";
sectionWindowDOMElement.style.left = "50%";
sectionWindowDOMElement.style.top = "50%";
sectionWindowDOMElement.style.transform = "translate(-50%, -50%)"; // Center the window
sectionWindowDOMElement.style.width = "30%";
sectionWindowDOMElement.style.height = "25%";
// Create a div element to contain the help text
const sectionWindowDOMElementtext = document.createElement('div');
sectionWindowDOMElementtext.innerHTML = `
<div style="margin-left: 20px;"> <!-- Add margin to the left side -->
    <p>To create a section plan double click over the face of a fragment.</p>
    </div>
`;
// Append the help text to the help window DOM element
sectionWindowDOMElement.appendChild(sectionWindowDOMElementtext);
// Add the help window to the viewer
viewer.ui.add(sectionWindow);
SectionButton.onClick.add(() => {
  sectionWindow.visible = !sectionWindow.visible;
  sectionWindow.active = sectionWindow.visible;
});
// Set the text content of the button
//resetButton.domElement.textContent = "Reset";

// Add the button to the mainToolbar

postproduction.customEffects.outlineEnabled = true;
const styler = new OBC.FragmentClipStyler(viewer);


visibilityToolbar.addChild(toggleButton, isolateButton,resetButton);

mainToolbar.addChild(SectionButton);
mainToolbar.addChild(styler.uiElement.get("mainButton"));
mainToolbar.addChild(dimensions.uiElement.get("main"),HelpButton); 
// Add event listener to the reset button
resetButton.onClick.add(() => {
  // Show all fragments
  showAllHiddenFragments();

  // Delete all dimensions
  dimensions.deleteAll();

  // Delete all clippers
  clipper.deleteAll();
});
// Find the dimensions button element
const dimensionsButton = dimensions.uiElement.get("main").domElement;
dimensionsButton.title = "Measure length between 2 points";
// Create a new click event
const clickEvent = new MouseEvent("click", {
  bubbles: true,
  cancelable: true,
  view: window
});

// Dispatch the click event on the dimensions button element
dimensionsButton.dispatchEvent(clickEvent);

// Create a new OBC.Button for the refresh functionality
const refreshButton = new OBC.Button(viewer, {
  tooltip: "Refresh",
  materialIconName: "refresh", // Material icon name for the refresh button
});

// Add an onClick event handler to reload the page when the button is clicked
refreshButton.onClick.add(() => {
  // Reload the page
  location.reload();
});

// Add the refresh button to the main toolbar
ifcLoaderToolbar.addChild(refreshButton);


