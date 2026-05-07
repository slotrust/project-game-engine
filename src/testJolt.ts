import initJolt from 'jolt-physics';

export async function loadJolt() {
    const Jolt = await initJolt();
    console.log(Jolt);
}
