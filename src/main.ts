import * as OBC from "openbim-components";
import * as THREE from "three";

const viewer = new OBC.Components();
viewer.onInitialized.add(() => {});

const sceneComponent = new OBC.SimpleScene(viewer);
sceneComponent.setup();
viewer.scene = sceneComponent;

const viewerContainer = document.getElementById(
  "webinar-sharepoint-viewer"
) as HTMLDivElement;
const rendererComponent = new OBC.PostproductionRenderer(
  viewer,
  viewerContainer
);
viewer.renderer = rendererComponent;
const postproduction = rendererComponent.postproduction;

const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer);
viewer.camera = cameraComponent;

const raycasterComponent = new OBC.SimpleRaycaster(viewer);
viewer.raycaster = raycasterComponent;

viewer.init();
postproduction.enabled = true;

const grid = new OBC.SimpleGrid(viewer, new THREE.Color(0x666666));
postproduction.customEffects.excludedMeshes.push(grid.get());

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
  propertiesProcessor.process(model);
  highlighter.events.select.onHighlight.add((selection) => {
    const fragmentID = Object.keys(selection)[0];
    const expressID = Number([...selection[fragmentID]][0]);
    propertiesProcessor.renderProperties(model, expressID);
  });
  highlighter.update();
});

const mainToolbar = new OBC.Toolbar(viewer);
mainToolbar.addChild(
  ifcLoader.uiElement.get("main"),
  propertiesProcessor.uiElement.get("main")
);    
viewer.ui.addToolbar(mainToolbar);

// Variable to store the last highlighted fragment's ID map
let lastHighlightedFragmentIdMap: { [fragmentId: string]: any } = {};


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
      console.log("Isolate button found"); // Add this line for debugging
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
// Set the text of the buttons