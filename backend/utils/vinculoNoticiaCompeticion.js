const Post = require('../models/Post');
const Competicion = require('../models/calendario/competicion');

// Enlaza (o desenlaza, si el nuevo id es vacío/null) una noticia con una competición,
// manteniendo la relación 1 a 1 en ambos sentidos: si la noticia ya estaba enlazada a
// otra competición, o la competición destino ya estaba enlazada a otra noticia, se
// desenlazan primero para no dejar referencias cruzadas inconsistentes.
// No hace falta guardar "post"/"competicion" tras llamar a estas funciones: ya persisten
// sus propios cambios; el llamador solo debe guardar el documento que ya tenía en mano.

async function sincronizarVinculoDesdeNoticia(post, nuevoCompeticionId) {
    const actual = post.competicion ? post.competicion.toString() : null;
    const nuevo = nuevoCompeticionId ? nuevoCompeticionId.toString() : null;

    if (actual === nuevo) return;

    if (actual) {
        await Competicion.updateOne({ _id: actual, postVinculado: post._id }, { $set: { postVinculado: null } });
    }

    if (nuevo) {
        const competicionDestino = await Competicion.findById(nuevo);
        if (!competicionDestino) {
            post.competicion = null;
            return;
        }
        if (competicionDestino.postVinculado && competicionDestino.postVinculado.toString() !== post._id.toString()) {
            await Post.updateOne({ _id: competicionDestino.postVinculado }, { $set: { competicion: null } });
        }
        competicionDestino.postVinculado = post._id;
        await competicionDestino.save();
    }

    post.competicion = nuevo || null;
}

async function sincronizarVinculoDesdeCompeticion(competicion, nuevoPostId) {
    const actual = competicion.postVinculado ? competicion.postVinculado.toString() : null;
    const nuevo = nuevoPostId ? nuevoPostId.toString() : null;

    if (actual === nuevo) return;

    if (actual) {
        await Post.updateOne({ _id: actual, competicion: competicion._id }, { $set: { competicion: null } });
    }

    if (nuevo) {
        const postDestino = await Post.findById(nuevo);
        if (!postDestino) {
            competicion.postVinculado = null;
            return;
        }
        if (postDestino.competicion && postDestino.competicion.toString() !== competicion._id.toString()) {
            await Competicion.updateOne({ _id: postDestino.competicion }, { $set: { postVinculado: null } });
        }
        postDestino.competicion = competicion._id;
        await postDestino.save();
    }

    competicion.postVinculado = nuevo || null;
}

module.exports = { sincronizarVinculoDesdeNoticia, sincronizarVinculoDesdeCompeticion };
