// utility function

import { BASE_URL } from "../constants/api";
import getHeaders from "./getHeaders";

const removeDisplayObj = async ({objects= [], canvas={}, setCanvas=() => {}, versionParams={}, createMode, signeeLevel, showError=() => {}}) => {

  console.log("current display objects", objects);

    await Promise.all(
        objects?.map((target) => {
          return (async () => {
            try {
              // processing signatures
  
              const signPage = target?.signPage;
              const signUrl = target?.signIndex;
  
              let signObjToRemove = null;
              let _signOptions = null;
  
              signObjToRemove = canvas[signPage].getObjects()?.find((target) => {
                console.log(
                  "current source canvas sign url",
                  target?._element?.currentSrc
                );
                return (
                  target?._element?.currentSrc ===
                  (signUrl?.startsWith("/")
                    ? `${window.location.origin}${signUrl}`
                    : signUrl)
                );
              });

              console.log("Sign object to remove display side", {signObjToRemove});
              
  
              if (signObjToRemove) {
                console.log("sign object to be removed from the canvas", {
                  signObjToRemove,
                  objects: canvas[signPage].getObjects(),
                });
  
                _signOptions = Object.keys(signObjToRemove)
                  ?.filter((key) => {
                    return (
                      !key?.startsWith("_") &&
                      !key?.startsWith("__") &&
                      !["canvas", "mouseMoveHandler"]?.includes(key)
                    );
                  })
                  ?.reduce((prev, next) => {
                    prev[next] = signObjToRemove[next];
                    return prev;
                  }, {});
  
                delete _signOptions["text"];
                delete _signOptions["delete"];
                delete _signOptions["textLines"];
                delete _signOptions["_text"];
                delete _signOptions["_textLines"];
                delete _signOptions["_unwrappedTextLines"];
                delete _signOptions["ownMatrixCache"];
                delete _signOptions["oCoords"];
                delete _signOptions["cacheHeight"];
                delete _signOptions["cacheWidth"];
                delete _signOptions["isMoving"];
                delete _signOptions["stroke"];
                delete _signOptions["ownMatrixCache"];
  
                _signOptions._element = {
                  nodeName: "IMG",
                  localName: "img",
                  loading: "auto",
                };
  
                _signOptions = JSON.stringify(_signOptions);
  
                console.log("prepared signature option for next", _signOptions);
  
                let displayId = null;
  
                await lookup(`${BASE_URL}/api/display-objects`, {
                  method: "POST",
                  body: JSON.stringify({
                    data: {
                      type: "image",
                      rawOptions: _signOptions,
                      page: signPage,
                    },
                  }),
                  headers: getHeaders({}),
                })
                  .then((res) =>
                    res.json().then((res) => {
                      console.log("successfully pushed display object", res);
  
                      displayId = res?.data?.id;
                    })
                  )
                  .catch((error) => {
                    console.log(
                      "an error has occured when creating display object",
                      error
                    );
                  });
  
                  if (Array?.isArray(versionParams.data.displayObjects)) {
                    versionParams.data.displayObjects.push(displayId);
                  } else {
                    versionParams.data.displayObjects = [displayId];
                  }
  
                if (!createMode) {
                  canvas[signPage].remove(signObjToRemove);
                }
  
                setCanvas(canvas);
              } else {
                console.log("couldn't get signature options");
              }
  
              // store the object
  
              let currentQueue = [];
  
              try {
                currentQueue = JSON.parse(
                  sessionStorage.getItem("versions-queue")
                );
  
                if (!Array.isArray(currentQueue)) {
                  currentQueue = [];
                }
              } catch (error) {
                console.log(
                  "an error has occured when trying to initial versions queue",
                  error
                );
              }
  
              const versionIndex = currentQueue?.findIndex((target) => {
                return target?.data?.level === signeeLevel;
              });
  
              console.log("current version queue params", {
                versionParams,
                versionIndex,
              });
  
              if (versionIndex > -1) {
                currentQueue[versionIndex] = versionParams;
  
                sessionStorage.setItem(
                  "versions-queue",
                  JSON.stringify(currentQueue)
                );
              } else {
                sessionStorage.setItem(
                  "versions-queue",
                  JSON.stringify([...currentQueue, versionParams])
                );
              }
  
              // const box = new fabric.Textbox("Lobababababa Loba", dateOptions);
            } catch (error) {
              console.log(
                "an error has occured when trying to get objects to remove from canvas",
                error
              );
  
              // alert("Une erreur est survenue");
            }
          })();
        })
      )
        .then((status) => {
          console.log("uploaded successfully display objects", status);
  
          return { processed: true };
        })
        .catch((error) => {
          console.log("an error has occured when processing initials", error);
  
          showError("Une erreur est survenue. Réessayez");
        });
}

export default removeDisplayObj
