export function inspect (object) {
    console.log(JSON.stringify(object, null, 2));
    return object;
}
