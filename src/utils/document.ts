
// utility function definition

const parseDocuments = (docObjects) => {
  return docObjects?.sort((prev, next) => {
    return new Date(next?.createdAt).getTime() - new Date(prev?.createdAt).getTime()
  })?.map((target) => {

    // console.log("received datat target for single doc", target);


    return {
      id: target?.id,
      author: {
        fullName:
          target?.author?.username,
        id: target?.author?.id,
        profile: `${process.env.REACT_APP_API_HOST}${target?.author?.profile?.url}`
      },
      title: target?.title,
      recipients: target?.recipients?.map(
        (recipient) => {
          return {
            fullName: recipient?.username,
            id: recipient?.id,
            profile: `${process.env.REACT_APP_API_HOST}${recipient?.profile?.url}`,
            email: recipient?.email,
            department:
              recipient?.department?.name,
          };
        }
      ),
      issuyingDate: new Date(
        target?.createdAt
      )?.toLocaleString("fr-FR"),
      expiryDate: new Date(
        target?.expiryDate
      )?.toLocaleString("fr-FR"),
      department: target?.department,
      status: target?.status,
      finalStatus: target?.finalStatus,
      file: {
        name: target?.file?.data
          ?.name,
        path: `${process.env.REACT_APP_API_HOST}${target?.file?.url}`,
      },
      versionId: target?.versionId,
      rejectedBy: target?.rejectedBy,
      rejectionDate: target?.rejectionDate,
      dateCoords: target?.dateCoords,
      signCoords: target?.signCoords,
      datePage: target?.datePage,
      signPage: target?.signPage,
      doc_folder: target?.doc_folder,
      attachedFiles: target?.attachedFiles?.map(file => {
        return {
          name: file?.name,
          path: `${process.env.REACT_APP_API_HOST}${file?.url}`,
        }
      }),
      levelVersions : target?.levelVersions,
      validationLevel : target?.validationLevel,
      createdAt: target?.createdAt
    };
  });
};

const parseSignatures = async (signatures, notProcessImage = false) => {
  return Promise.all(
    signatures?.map((target, index) => {


      console.log("signature target data", target);


      return  lookup(
        `${notProcessImage ? window?.location?.origin : process.env.REACT_APP_API_HOST}${target?.sign?.url}`
      )
        .then((res) =>
          res
            .blob()
            .then((_sign) => {
              const sign = new File([_sign], `sign${index}`, {
                type: "image/png",
              });

              const signLocalUrl = URL.createObjectURL(sign);

              return {
                id: target?.id,
                signature: notProcessImage ? target?.sign?.url :  signLocalUrl,
                creationDate: new Date(
                  target?.createdAt
                )?.toLocaleString(
                  window?.navigator?.language
                ),
              };
            })
            .catch((error) => {
              console.log(
                "an error has occured when processing sign local image",
                error
              );

              return {};
            })
        )
        .catch((error) => {
          console.log(
            "an error has occured when processing sign local image",
            error
          );

          return {};
        });
    })
  );
}

export { parseDocuments, parseSignatures };
