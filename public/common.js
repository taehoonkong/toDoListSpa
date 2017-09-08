function render({ target, templatePath, dataPath, queryFrom = document }) {
  // 템플릿 가져오기
  const templatePromise = axios.get(templatePath)

  // 데이터 가져오기
  const dataPromise = axios.get(dataPath)

  // 둘다 완료되면...
  return Promise.all([templatePromise, dataPromise])
    .then(([templateRes, dataRes]) => {
      // 템플릿 렌더링하기
      const html = ejs.render(templateRes.data, {
        data: dataRes.data
      })
      console.log('data?', dataRes.data)

      // 렌더링 결과를 문서에 주입하기
      const targetEl = queryFrom.querySelector(target)
      targetEl.innerHTML = html
      return targetEl
    })

  // 위에서 Promise를 반환하고 있기 때문에 render 함수의 반환값에 `.then`을 이어붙일 수 있습니다.
}
