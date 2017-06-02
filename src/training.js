class TrainingData {
  constructor(targetDate, trainingList){
    var trainingLength = trainingList.length;
    targetDate.subtract(trainingLength, 'days');

    var trainingData = {};
    for(var d=0; d<trainingLength; d++){
      targetDate.add(1,'days');
      trainingData[targetDate.format('YYYY-MM-DD')] = trainingList[d];
    }
    return trainingData;
  }
}

module.exports.trainingCreate = function(eventDate, trainingList) {
   return new TrainingData(eventDate, trainingList);
};