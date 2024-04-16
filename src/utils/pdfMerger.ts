// utility function definition

import PDFMerger from 'pdf-merger-js/browser';
import { BASE_URL } from '../constants/api';
import getHeaders from './getHeaders';

const mergePdf = async ({ files, parentDocument = "" }) => {
  const merger = new PDFMerger();

  const filesToBeConverted = [];

  files = files?.filter(file => {
    if (file?.name?.endsWith(".pdf")) {
      return true
    } else {
      filesToBeConverted?.push(file);

      return false
    }
  });


  console.log("files to be converted here", { filesToBeConverted, files });

  await Promise.all(filesToBeConverted?.map(target => {
    return (async () => {

      const formData = new FormData();

      formData?.append("files", target);

      const _headers = new Headers();

      _headers?.append("Accept", "application/json");
      _headers?.append(
        "Authorization",
        `Bearer ${sessionStorage?.getItem("token")}`
      );


      await lookup(`${BASE_URL}/api/upload`, {
        method: "POST",
        headers: _headers,
        body: formData,
      })
        .then((res) =>
          res
            .json()
            .then(async (res) => {
              if ([403, 401]?.includes(res?.error?.status)) {
                sessionStorage.clear();

                alert("Erreur d'authentification")
              } else {
                console.log("received data for annex conversion", res);

                const filePath = res[0]?.url;
                const fileName = res[0]?.name;

                await lookup(`${BASE_URL}/api/convert`, {
                  headers: getHeaders({}),
                  body: JSON.stringify({
                    data: {
                      filePath,
                    },
                  }),
                  method: "POST",
                }).then((res) =>
                  res.json().then(async (res) => {
                    if ([403, 401]?.includes(res?.error?.status)) {
                      sessionStorage.clear();

                      alert("Erreur d'authentification")
                    } else {
                      console.log("received data after conversion file upload", res);

                      let fileBlob = "";

                      const _headers = new Headers();

                      _headers?.append("Content-Type", "application/json");
                      _headers?.append(
                        "Authorization",
                        `Bearer ${sessionStorage?.getItem("token")}`
                      );

                      await lookup(`${BASE_URL}${res?.pdfFilePath}`, {
                        headers: _headers,
                        method: "GET",
                      })
                        .then((res) =>
                          res
                            ?.blob()
                            .then((data) => {
                              fileBlob = data;
                            })
                            .catch((error) => {
                              console.log(
                                "an error has occured when getting file",
                                error
                              );
                            })
                        )
                        .catch((error) => {
                          console.log("an error has occured when getting file", error);
                        });

                      const _file = new File(
                        [fileBlob],
                        fileName?.replace(".docx", ".pdf")?.replace(".doc", ".pdf")?.replace(".jpeg", ".pdf")?.replace(".png", ".pdf")?.replace(".svg", ".pdf"),
                        {
                          type: "application/pdf",
                        }
                      );

                      files?.push(_file);
                    }
                  }))
              }
            })

            .catch((error) => {
              console.log(
                "an error has occured when uploading file for conversion",
                error
              );
            })
        )
        .catch((error) => {
          console.log(
            "an error has occured when uploading file for conversion",
            error
          );
        });
    })()
  }))

  for (const file of files) {
    await merger.add(file);
  }

  await merger.setMetadata({
    producer: "Rhinoceros Software SAS"
  });

  const mergedPdf = await merger.saveAsBlob();

  const url = URL.createObjectURL(mergedPdf);

  return {
    file: new File([mergedPdf], `Annexes_de_${parentDocument}_${Date.now()}.pdf`, {
      type: "application/pdf",
    }),
    url
  }
}

export default mergePdf