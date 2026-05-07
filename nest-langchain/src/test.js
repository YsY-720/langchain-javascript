function* generateSequence() {
  yield 1;
  yield 2;
  yield 3;
}

const generator = generateSequence();
for (const chunk of generator) {
  console.log(chunk);
}

let range = {
  from: 0,
  to: 10,
  *[Symbol.iterator]() {
    for (let value = this.from; value <= this.to; value++) {
      yield value;
    }
  },
};

function* gen() {
  let result = yield '2 + 2 = ?';
  console.log(result);
}

let geng = gen();
let question = geng.next().value;
console.log(geng.next(4));
